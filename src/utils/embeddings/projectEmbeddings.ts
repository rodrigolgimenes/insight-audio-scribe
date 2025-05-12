
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { logError, logSuccess } from '@/lib/logger';

/**
 * Triggers the generation of embeddings for a project
 * @param projectId The ID of the project to generate embeddings for
 * @param manualTrigger Whether this is a manual trigger (forces regeneration)
 * @returns Promise that resolves when the embedding generation is initiated
 */
export async function generateProjectEmbeddings(
  projectId: string, 
  manualTrigger: boolean = false
): Promise<{ success: boolean; message: string }> {
  try {
    console.log(`Generating embeddings for project ${projectId}`);
    
    const { data, error } = await supabase.functions.invoke('vectorize-project', {
      body: { 
        project_id: projectId,
        manual_trigger: manualTrigger 
      }
    });
    
    if (error) {
      console.error('Error calling vectorize-project function:', error);
      logError(`Failed to generate embeddings: ${error.message}`);
      return { 
        success: false, 
        message: `Failed to generate embeddings: ${error.message}` 
      };
    }
    
    console.log('Embedding generation response:', data);
    logSuccess(`Embedding generation initiated for project ${projectId}`);
    
    return { 
      success: true, 
      message: data.message || 'Embedding generation initiated successfully' 
    };
  } catch (error) {
    console.error('Error in generateProjectEmbeddings:', error);
    logError(`Error generating embeddings: ${error.message || 'Unknown error'}`);
    return { 
      success: false, 
      message: `Unexpected error: ${error.message || 'Unknown error'}` 
    };
  }
}

/**
 * Generate a search embedding for text comparison
 * @param text The text to generate an embedding for
 * @returns The embedding as a JSON array
 */
export async function generateSearchEmbedding(text: string): Promise<any> {
  try {
    const { data, error } = await supabase.functions.invoke('generate-search-embedding', {
      body: { search_text: text }
    });
    
    if (error || !data || !data.embedding) {
      console.error('Error generating search embedding:', error || 'No embedding returned');
      return null;
    }
    
    return data.embedding;
  } catch (error) {
    console.error('Error generating search embedding:', error);
    return null;
  }
}

/**
 * Finds projects similar to the provided text
 * @param searchText The text to find similar projects for
 * @param threshold Similarity threshold (0.0 to 1.0, higher is more similar)
 * @param limit Maximum number of results to return
 * @returns Promise that resolves to similar project IDs and their similarity scores
 */
export async function findSimilarProjects(
  searchText: string,
  threshold: number = 0.7,
  limit: number = 5
): Promise<Array<{ projectId: string; similarity: number; projectName?: string }>> {
  try {
    // First, generate an embedding for the search text
    const searchEmbedding = await generateSearchEmbedding(searchText);
    
    if (!searchEmbedding) {
      return [];
    }

    // Then, fetch all project embeddings
    const { data: embeddings, error: embeddingsError } = await supabase
      .from('project_embeddings')
      .select('project_id, embedding');
      
    if (embeddingsError || !embeddings) {
      console.error('Error fetching project embeddings:', embeddingsError || 'No embeddings returned');
      return [];
    }
    
    // Calculate similarity scores locally
    const results = embeddings
      .map(item => {
        try {
          // Parse JSON embedding if it's stored as string
          const embedding = typeof item.embedding === 'string' 
            ? JSON.parse(item.embedding) 
            : item.embedding;
            
          // Calculate cosine similarity
          const similarity = cosineSimilarity(searchEmbedding, embedding);
          
          return {
            projectId: item.project_id,
            similarity
          };
        } catch (e) {
          console.error('Error processing embedding:', e);
          return { projectId: item.project_id, similarity: 0 };
        }
      })
      // Filter by threshold
      .filter(item => item.similarity > threshold)
      // Sort by similarity (highest first)
      .sort((a, b) => b.similarity - a.similarity)
      // Limit results
      .slice(0, limit);
      
    // Fetch project names for the matched projects
    if (results.length > 0) {
      const projectIds = results.map(item => item.projectId);
      
      const { data: projects } = await supabase
        .from('projects')
        .select('id, name')
        .in('id', projectIds);
        
      if (projects && projects.length > 0) {
        // Add project names to results
        return results.map(result => {
          const project = projects.find(p => p.id === result.projectId);
          return {
            ...result,
            projectName: project ? project.name : undefined
          };
        });
      }
    }
    
    return results;
  } catch (error) {
    console.error('Error in findSimilarProjects:', error);
    return [];
  }
}

/**
 * Helper function to calculate cosine similarity between two vectors
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length) {
    console.error('Vector dimensions do not match');
    return 0;
  }
  
  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    magnitudeA += vecA[i] * vecA[i];
    magnitudeB += vecB[i] * vecB[i];
  }
  
  magnitudeA = Math.sqrt(magnitudeA);
  magnitudeB = Math.sqrt(magnitudeB);
  
  if (magnitudeA === 0 || magnitudeB === 0) return 0;
  
  return dotProduct / (magnitudeA * magnitudeB);
}

/**
 * Ensures a project has embeddings generated
 * This is useful to call when viewing or editing a project
 */
export async function ensureProjectEmbeddings(projectId: string): Promise<void> {
  try {
    // Check if the project already has embeddings
    const { data, error } = await supabase
      .from('project_embeddings')
      .select('id')
      .eq('project_id', projectId)
      .maybeSingle();

    // If there's no embedding or an error occurred, generate a new one
    if (error || !data) {
      console.log(`No embeddings found for project ${projectId}, generating now...`);
      await generateProjectEmbeddings(projectId, false);
    }
  } catch (error) {
    console.error('Error in ensureProjectEmbeddings:', error);
  }
}
