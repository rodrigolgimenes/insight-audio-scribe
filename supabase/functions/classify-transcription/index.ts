// 1) Necessary for some Deno libraries that use XMLHttpRequest
import "https://deno.land/x/xhr@0.1.0/mod.ts";
// 2) HTTP server
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
// 3) Supabase client
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
// 4) OpenAI client
import { Configuration, OpenAIApi } from "https://esm.sh/openai@3.3.0";

// CORS headers
const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Environment variables
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const OPENAI_KEY = Deno.env.get("OPENAI_API_KEY")!;

if (!SUPABASE_URL || !SUPABASE_KEY || !OPENAI_KEY) {
  console.error("❌ Missing required environment variables");
  throw new Error("Missing required environment variables");
}

// Initialize Supabase and OpenAI clients
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAIApi(new Configuration({ apiKey: OPENAI_KEY }));

// Constants
const EMBEDDING_MODEL = "text-embedding-ada-002";
const GPT_MODEL = "gpt-4o-mini";
// Tiered thresholds
const SIMILARITY_THRESHOLDS = {
  GENERAL: 0.45, // 45% - minimum for general classification
  WEIGHTED: 0.35, // 35% - minimum for weighted classification
  FIELD_SPECIFIC: 0.65, // 65% - for field specific matches
  TEXT_BASED: 0.70, // 70% - for text-based classification
  TIEBREAKER: 0.05 // difference required to avoid tiebreaker
};

/**
 * Generate an embedding for the given text
 */
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.createEmbedding({
      model: EMBEDDING_MODEL,
      input: text,
    });
    return response.data.data[0].embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

/**
 * Find projects similar to the given note content
 */
async function findSimilarProjects(
  noteContent: string,
  threshold: number = SIMILARITY_THRESHOLDS.GENERAL,
  limit: number = 5
): Promise<Array<{ 
  projectId: string; 
  similarity: number; 
  projectName?: string;
  projectDescription?: string;
  method?: string;
}>> {
  try {
    console.log(`Finding similar projects with threshold ${threshold} and limit ${limit}`);
    
    // Generate embedding for the note content
    const searchEmbedding = await generateEmbedding(noteContent);
    
    // Use the database function to find similar projects based on cosine similarity
    const { data, error } = await supabase
      .rpc('find_similar_projects', {
        project_embedding: searchEmbedding,
        similarity_threshold: threshold,
        max_results: limit * 2 // Get more results for potential tiebreaking
      });
    
    if (error) {
      console.error('Error finding similar projects:', error);
      throw new Error(`Failed to find similar projects: ${error.message}`);
    }
    
    // Fetch project names for the similar projects
    const projectIds = data.map(item => item.project_id);
    const { data: projects, error: projectsError } = await supabase
      .from('projects')
      .select('id, name, description')
      .in('id', projectIds);
    
    if (projectsError) {
      console.error('Error fetching project names:', projectsError);
    }
    
    // Combine similarity scores with project names
    const results = data.map(item => {
      const project = projects?.find(p => p.id === item.project_id);
      return {
        projectId: item.project_id,
        similarity: item.similarity,
        projectName: project?.name,
        projectDescription: project?.description,
        method: 'embedding'
      };
    });
    
    // Handle potential tiebreakers
    // If top 2 scores are very close, use GPT to break the tie
    if (results.length >= 2 && 
        results[0].similarity - results[1].similarity < SIMILARITY_THRESHOLDS.TIEBREAKER &&
        results[0].similarity > SIMILARITY_THRESHOLDS.GENERAL) {
      
      try {
        console.log("Close scores detected, using GPT for tiebreaking");
        
        const tieProjects = results.slice(0, 2).map(p => ({
          id: p.projectId,
          name: p.projectName || "Unknown",
          description: p.projectDescription || "",
          score: p.similarity
        }));
        
        // Tiebreaker with GPT
        const tiebreakerResult = await breakTieWithGPT(noteContent, tieProjects);
        
        // If we got a valid result, update the scores
        if (tiebreakerResult && tiebreakerResult.selectedProjectId) {
          // Find the selected project and boost its score
          const selectedIndex = results.findIndex(p => p.projectId === tiebreakerResult.selectedProjectId);
          if (selectedIndex >= 0) {
            results[selectedIndex].similarity += 0.1; // Boost the score
            results[selectedIndex].method = 'embedding+gpt'; // Mark the method as combo
            
            // Update the reason
            if (tiebreakerResult.reason) {
              // We'll use this reason later
              results[selectedIndex].tiebreakReason = tiebreakerResult.reason;
            }
            
            // Re-sort by similarity
            results.sort((a, b) => b.similarity - a.similarity);
          }
        }
      } catch (tiebreakerError) {
        console.error('Tiebreaker error:', tiebreakerError);
        // Continue with original results if tiebreaker fails
      }
    }
    
    // If no good match was found with embedding, try text-based classification with GPT
    if (results.length === 0 || results[0].similarity < threshold) {
      try {
        console.log("No strong match with embeddings, attempting text-based classification");
        
        // Fetch all user projects for text-based classification
        const { data: allProjects, error: allProjectsError } = await supabase
          .from('projects')
          .select('id, name, description, scope, objective, user_role, business_area, key_terms');
        
        if (allProjectsError) {
          console.error('Error fetching all projects:', allProjectsError);
          // Just return the embedding results even if below threshold
          return results.slice(0, limit);
        }
        
        // Perform text-based classification with GPT
        const textClassification = await classifyWithGPT(noteContent, allProjects);
        
        if (textClassification && textClassification.projectId && textClassification.confidence) {
          // Add the text-based classification result
          const selectedProject = allProjects.find(p => p.id === textClassification.projectId);
          
          if (selectedProject && textClassification.confidence >= SIMILARITY_THRESHOLDS.TEXT_BASED) {
            // Insert the GPT classification at the beginning if its confidence is higher
            const gptResult = {
              projectId: textClassification.projectId,
              similarity: textClassification.confidence,
              projectName: selectedProject.name,
              projectDescription: selectedProject.description,
              method: 'gpt',
              textReason: textClassification.reason
            };
            
            // If we already have this project from embedding but with lower score, replace it
            const existingIndex = results.findIndex(p => p.projectId === gptResult.projectId);
            if (existingIndex >= 0) {
              if (results[existingIndex].similarity < gptResult.similarity) {
                results[existingIndex] = gptResult;
                // Re-sort by similarity
                results.sort((a, b) => b.similarity - a.similarity);
              }
            } else {
              // Add the new result and resort
              results.push(gptResult);
              results.sort((a, b) => b.similarity - a.similarity);
            }
          }
        }
      } catch (gptError) {
        console.error('GPT classification error:', gptError);
        // Continue with original results if GPT classification fails
      }
    }
    
    return results.slice(0, limit);
  } catch (error) {
    console.error('Error in findSimilarProjects:', error);
    throw new Error(`Failed to find similar projects: ${error.message}`);
  }
}

/**
 * Break a tie between two similar projects using GPT
 */
async function breakTieWithGPT(
  noteContent: string,
  projects: Array<{ id: string; name: string; description?: string; score: number }>
): Promise<{ selectedProjectId: string; reason: string }> {
  try {
    // Truncate note content if too long
    const truncatedContent = noteContent.length > 2000 
      ? noteContent.substring(0, 2000) + "..."
      : noteContent;
    
    // Create prompt for GPT
    const prompt = `
      You are analyzing a meeting transcript to determine which project it belongs to.
      
      TRANSCRIPT:
      "${truncatedContent}"
      
      Here are the two most likely projects (with very similar scores):
      
      Project 1: ${projects[0].name}
      Score: ${(projects[0].score * 100).toFixed(1)}%
      Description: ${projects[0].description || "No description available"}
      
      Project 2: ${projects[1].name}
      Score: ${(projects[1].score * 100).toFixed(1)}%
      Description: ${projects[1].description || "No description available"}
      
      Based on ONLY the transcript content, determine which project is a better match.
      Return your response in valid JSON format with two fields:
      1. "selectedProject": either "1" or "2" (indicating which project number is the better match)
      2. "reason": a brief explanation of why this project is the better match (2-3 sentences maximum)
    `;
    
    const response = await openai.createChatCompletion({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes text to categorize it into projects." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 300
    });
    
    const responseText = response.data.choices[0].message?.content || "";
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      if (!jsonResponse.selectedProject || !jsonResponse.reason) {
        throw new Error("Invalid response format");
      }
      
      // Map the selected project number back to the project ID
      const selectedIndex = parseInt(jsonResponse.selectedProject) - 1;
      if (selectedIndex < 0 || selectedIndex >= projects.length) {
        throw new Error("Invalid project selection");
      }
      
      return {
        selectedProjectId: projects[selectedIndex].id,
        reason: jsonResponse.reason
      };
    } catch (parseError) {
      console.error('Error parsing GPT tiebreaker response:', parseError);
      console.log('Response text:', responseText);
      
      // If parsing fails, just pick the higher scored one
      return {
        selectedProjectId: projects[0].score >= projects[1].score ? projects[0].id : projects[1].id,
        reason: "Selected based on embedding similarity score due to parsing error."
      };
    }
  } catch (error) {
    console.error('Error in breakTieWithGPT:', error);
    throw new Error(`Failed to break tie: ${error.message}`);
  }
}

/**
 * Classify note content to a project using GPT
 */
async function classifyWithGPT(
  noteContent: string,
  projects: any[]
): Promise<{ projectId: string; confidence: number; reason: string } | null> {
  if (projects.length === 0) return null;
  
  try {
    // Truncate note content if too long
    const truncatedContent = noteContent.length > 2000 
      ? noteContent.substring(0, 2000) + "..."
      : noteContent;
    
    // Format projects for the prompt
    const projectsList = projects.map((p, index) => `
      Project ${index + 1}: ${p.name}
      ID: ${p.id}
      Description: ${p.description || "No description"}
      Scope: ${p.scope || "N/A"}
      Objective: ${p.objective || "N/A"}
      Business Areas: ${(p.business_area || []).join(", ")}
      Key Terms: ${(p.key_terms || []).join(", ")}
    `).join("\n");
    
    // Create prompt for GPT
    const prompt = `
      You are analyzing a meeting transcript to determine which project it belongs to.
      
      TRANSCRIPT:
      "${truncatedContent}"
      
      Here are the available projects:
      ${projectsList}
      
      Based on ONLY the transcript content, determine which project is the best match.
      If there is no good match, indicate so with a confidence of 0.
      
      Return your response in valid JSON format with three fields:
      1. "projectId": the ID of the selected project (exactly as provided above)
      2. "confidence": a score between 0 and 1 indicating your confidence in this match
      3. "reason": a brief explanation of why this project is the best match (2-3 sentences)
      
      If no project is a good match, set confidence to 0 and explain why.
    `;
    
    const response = await openai.createChatCompletion({
      model: GPT_MODEL,
      messages: [
        { role: "system", content: "You are a helpful assistant that analyzes text to categorize it into projects." },
        { role: "user", content: prompt }
      ],
      temperature: 0.2,
      max_tokens: 500
    });
    
    const responseText = response.data.choices[0].message?.content || "";
    
    try {
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("No JSON found in response");
      
      const jsonResponse = JSON.parse(jsonMatch[0]);
      
      if (!jsonResponse.projectId || jsonResponse.confidence === undefined || !jsonResponse.reason) {
        throw new Error("Invalid response format");
      }
      
      // Validate that the project ID actually exists in our list
      const projectExists = projects.some(p => p.id === jsonResponse.projectId);
      if (!projectExists && jsonResponse.confidence > 0) {
        throw new Error("Invalid project ID returned");
      }
      
      return {
        projectId: jsonResponse.projectId,
        confidence: jsonResponse.confidence,
        reason: jsonResponse.reason
      };
    } catch (parseError) {
      console.error('Error parsing GPT classification response:', parseError);
      console.log('Response text:', responseText);
      return null;
    }
  } catch (error) {
    console.error('Error in classifyWithGPT:', error);
    throw new Error(`Failed to classify with GPT: ${error.message}`);
  }
}

/**
 * Generate a detailed reason for the classification
 */
async function generateClassificationReason(
  noteContent: string,
  project: any,
  similarProjects: any[],
  similarityScore: number,
  method: string
): Promise<string> {
  try {
    // Build a default reason in case GPT fails
    let defaultReason = `Esta transcrição foi classificada para o projeto "${project.name}" `;
    
    if (method === 'embedding') {
      defaultReason += `com uma pontuação de similaridade semântica de ${(similarityScore * 100).toFixed(1)}%.`;
    } else if (method === 'embedding+gpt') {
      defaultReason += `usando análise semântica com desempate por IA, com pontuação final de ${(similarityScore * 100).toFixed(1)}%.`;
    } else if (method === 'gpt') {
      defaultReason += `através de análise textual, com confiança de ${(similarityScore * 100).toFixed(1)}%.`;
    } else {
      defaultReason += `com pontuação de similaridade de ${(similarityScore * 100).toFixed(1)}%.`;
    }
    
    // Try to use GPT for a more detailed explanation
    try {
      // Truncate note content if too long
      const truncatedContent = noteContent.length > 1500 
        ? noteContent.substring(0, 1500) + "..."
        : noteContent;
      
      // Build competing projects info if available
      let competitorsText = "";
      if (similarProjects && similarProjects.length > 0) {
        competitorsText = "Projetos competidores:\n";
        similarProjects.slice(0, 2).forEach((p, i) => {
          competitorsText += `${i+1}. "${p.projectName}" (${(p.similarity * 100).toFixed(1)}%)\n`;
        });
      }
      
      // Create prompt for GPT
      const prompt = `
        Sistema: Você é um analista especializado em classificação de documentos. Sua tarefa é explicar por que uma transcrição foi classificada para um determinado projeto.
        
        Transcrição (trecho): "${truncatedContent}"
        
        Projeto escolhido: "${project.name}"
        Descrição do projeto: "${project.description || 'N/A'}"
        Escopo: "${project.scope || 'N/A'}"
        Objetivo: "${project.objective || 'N/A'}"
        Cargo do usuário: "${project.user_role || 'N/A'}"
        Áreas de negócio: "${(project.business_area || []).join(', ')}"
        Termos-chave: "${(project.key_terms || []).join(', ')}"
        
        ${competitorsText}
        
        Método de classificação: ${method === 'embedding' ? 'Similaridade semântica por embeddings' : 
                                 method === 'embedding+gpt' ? 'Similaridade semântica com desempate por IA' :
                                 method === 'gpt' ? 'Análise textual por IA' : 'Classificação automática'}
        Pontuação de similaridade: ${(similarityScore * 100).toFixed(1)}%
        
        Por favor, explique em dois parágrafos concisos e objetivos:
        1. Por que esta transcrição foi associada a este projeto
        2. Que características específicas no texto levaram a esta classificação
        
        Sua explicação deve ser em português e utilizar termos técnicos se apropriado.
        Foque em explicar a similaridade semântica ou textual que levou à classificação.
        Se houver menções diretas ao nome do projeto ou palavras-chave específicas, destaque isso.
      `;
      
      const response = await openai.createChatCompletion({
        model: GPT_MODEL,
        messages: [
          { role: "system", content: "Você é um assistente que explica classificações de documentos." },
          { role: "user", content: prompt }
        ],
        temperature: 0.3,
        max_tokens: 300
      });
      
      const explanation = response.data.choices[0].message?.content;
      if (explanation && explanation.length > 20) {
        return explanation;
      }
      
      // Fall back to default reason if GPT explanation is too short
      return defaultReason;
    } catch (gptError) {
      console.error('Error generating explanation with GPT:', gptError);
      return defaultReason;
    }
  } catch (error) {
    console.error('Error in generateClassificationReason:', error);
    return `Classificado para o projeto "${project.name}" com pontuação de ${(similarityScore * 100).toFixed(1)}%.`;
  }
}

/**
 * Classify a note to relevant projects
 */
async function classifyNoteToProjects(
  noteId: string,
  noteContent?: string,
  threshold: number = SIMILARITY_THRESHOLDS.GENERAL,
  limit: number = 5
): Promise<Array<{
  projectId: string;
  similarity: number;
  projectName?: string;
  projectDescription?: string;
  classificationReason: string;
  classificationMethod: string;
  status: 'classified' | 'processed' | 'failed';
}>> {
  try {
    let content = noteContent;
    
    // If no content is provided, fetch the note content
    if (!content) {
      const { data: note, error: noteError } = await supabase
        .from('notes')
        .select('title, processed_content, original_transcript')
        .eq('id', noteId)
        .single();
      
      if (noteError || !note) {
        console.error('Error fetching note:', noteError);
        throw new Error(`Failed to fetch note: ${noteError?.message || 'Note not found'}`);
      }
      
      content = [
        note.title || '',
        note.processed_content || '',
        note.original_transcript || ''
      ].filter(Boolean).join('\n\n');
    }
    
    if (!content || content.trim().length < 10) {
      throw new Error('Note content is too short for classification');
    }
    
    // Find similar projects
    const similarProjects = await findSimilarProjects(content, threshold, limit);
    console.log('Similar projects found:', similarProjects.length);
    
    // Track the best score for reporting even if below threshold
    let bestScore = similarProjects.length > 0 ? similarProjects[0].similarity : 0;
    
    // Record classification results with detailed reasons
    const classificationResults = [];
    
    // First fetch all project details for the similar projects
    const projectIds = similarProjects.map(p => p.projectId);
    if (projectIds.length === 0) {
      return [];
    }
    
    const { data: projectDetails, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .in('id', projectIds);
    
    if (projectError) {
      console.error('Error fetching project details:', projectError);
      // Continue without detailed project info
    }
    
    // Generate classifications with detailed reasons
    for (const project of similarProjects) {
      const projectDetail = projectDetails?.find(p => p.id === project.projectId) || {
        id: project.projectId,
        name: project.projectName || 'Unknown Project',
        description: project.projectDescription || null
      };
      
      // Determine if this classification meets our threshold
      const passesThreshold = project.similarity >= threshold;
      const status = passesThreshold ? 'classified' : 'processed';
      
      // Generate a detailed reason
      let reason = "";
      
      // Use tiebreaker reason if available
      if (project.method === 'embedding+gpt' && project.tiebreakReason) {
        reason = `Este projeto foi selecionado por análise combinada (embeddings + desempate por IA). ${project.tiebreakReason}`;
      } 
      // Use text-based reason if available
      else if (project.method === 'gpt' && project.textReason) {
        reason = project.textReason;
      }
      // Otherwise generate a reason
      else {
        reason = await generateClassificationReason(
          content,
          projectDetail,
          similarProjects.filter(p => p.projectId !== project.projectId),
          project.similarity,
          project.method || 'embedding'
        );
      }
      
      classificationResults.push({
        projectId: project.projectId,
        similarity: project.similarity,
        projectName: project.projectName || projectDetail.name || 'Unknown Project',
        projectDescription: project.projectDescription || projectDetail.description || null,
        classificationReason: reason,
        classificationMethod: project.method || 'embedding',
        status
      });
    }
    
    const now = new Date().toISOString();
    
    // Record all classifications in the notes_projects table, including those below threshold
    const classifications = classificationResults.map(project => ({
      note_id: noteId,
      project_id: project.projectId,
      similarity_score: project.similarity,
      classified_at: now,
      classification_reason: project.classificationReason,
      classification_method: project.classificationMethod,
      status: project.status
    }));
    
    if (classifications.length > 0) {
      // First delete any existing classifications
      const { error: deleteError } = await supabase
        .from('notes_projects')
        .delete()
        .eq('note_id', noteId);
      
      if (deleteError) {
        console.error('Error removing existing classifications:', deleteError);
      }
      
      // Insert new classifications
      const { error: insertError } = await supabase
        .from('notes_projects')
        .insert(classifications);
      
      if (insertError) {
        console.error('Error recording classifications:', insertError);
      }
    }
    
    return classificationResults;
  } catch (error) {
    console.error('Error in classifyNoteToProjects:', error);
    throw new Error(`Failed to classify note: ${error.message}`);
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS });
  }
  
  try {
    // Parse request body
    const { 
      noteId, 
      noteContent, 
      threshold = SIMILARITY_THRESHOLDS.GENERAL, 
      limit = 5 
    } = await req.json();
    
    if (!noteId && !noteContent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Either noteId or noteContent is required',
          threshold_used: threshold
        }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 400 }
      );
    }
    
    // Classify note to relevant projects
    const classifications = await classifyNoteToProjects(noteId, noteContent, threshold, limit);
    
    // Get the best score for reporting
    const bestScore = classifications.length > 0 
      ? Math.max(...classifications.map(c => c.similarity))
      : 0;
      
    // Check if any classification passed the threshold
    const passedThreshold = classifications.some(c => c.status === 'classified');
    
    // Return classifications
    return new Response(
      JSON.stringify({ 
        success: passedThreshold,
        classifications,
        count: classifications.length,
        best_score: bestScore,
        threshold_used: threshold,
        error: !passedThreshold ? "No projects matched with sufficient confidence" : undefined
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in classify-transcription function:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message || 'Unknown error',
        classifications: []
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});
