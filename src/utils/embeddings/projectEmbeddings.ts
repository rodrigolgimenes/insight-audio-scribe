
import { supabase } from '@/integrations/supabase/client';

/**
 * Generate embeddings for a project
 */
export const generateProjectEmbeddings = async (
  projectId: string,
  force: boolean = false
): Promise<{ success: boolean; message: string }> => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return { 
        success: false, 
        message: projectError?.message || 'Project not found' 
      };
    }

    // Combine project data into a contextual representation
    const projectContext = `
      Name: ${project.name}
      Description: ${project.description || ''}
      Scope: ${project.scope || ''}
      Objective: ${project.objective || ''}
      User Role: ${project.user_role || ''}
      Business Areas: ${(project.business_area || []).join(', ')}
      Key Terms: ${(project.key_terms || []).join(', ')}
      Meeting Types: ${(project.meeting_types || []).join(', ')}
    `;

    // Generate a simple hash for content checking
    const contentHash = btoa(projectContext).slice(0, 12);
    
    // Check if we already have an embedding for this content hash
    const { data: existingEmbedding, error: embeddingError } = await supabase
      .from('project_embeddings')
      .select('*')
      .eq('project_id', projectId)
      .eq('content_hash', contentHash)
      .eq('field_type', 'full')
      .maybeSingle();
    
    if (existingEmbedding && !force) {
      console.log('Embedding already exists with the same hash, skipping...');
      return {
        success: true,
        message: 'Embedding already exists'
      };
    }

    // Call the edge function to generate the embedding
    // Fix: Use the correct parameter name 'project_id' for compatibility with the edge function
    const { data: result, error: invokeError } = await supabase.functions.invoke('vectorize-project', {
      body: { 
        project_id: projectId, // Changed from projectId to project_id
        forceUpdate: force,
        content: projectContext,
        contentHash: contentHash,
        fieldType: 'full'
      }
    });
    
    if (invokeError) {
      console.error('Error invoking vectorize-project function:', invokeError);
      return {
        success: false,
        message: invokeError.message
      };
    }
    
    return {
      success: true,
      message: 'Embedding generation initiated'
    };
  } catch (error) {
    console.error('Error in generateProjectEmbeddings:', error);
    return {
      success: false,
      message: error.message
    };
  }
};

/**
 * Find projects similar to the provided text
 */
export const findSimilarProjects = async (
  searchText: string,
  threshold: number = 0.7,
  limit: number = 5
): Promise<Array<{ projectId: string; similarity: number; projectName?: string }>> => {
  try {
    const { data: similarProjects, error } = await supabase.rpc('find_similar_projects', {
      search_text: searchText,
      similarity_threshold: threshold,
      max_results: limit
    });

    if (error) {
      console.error('Error finding similar projects:', error);
      return [];
    }

    return similarProjects || [];
  } catch (error) {
    console.error('Error in findSimilarProjects:', error);
    return [];
  }
};

/**
 * Ensure a project has embeddings generated
 */
export const ensureProjectEmbeddings = async (projectId: string) => {
  try {
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single();

    if (projectError || !project) {
      console.error('Error fetching project:', projectError);
      return;
    }

    // Combine project data into a contextual representation
    const projectContext = `
      Name: ${project.name}
      Description: ${project.description || ''}
      Scope: ${project.scope || ''}
      Objective: ${project.objective || ''}
      User Role: ${project.user_role || ''}
      Business Areas: ${(project.business_area || []).join(', ')}
      Key Terms: ${(project.key_terms || []).join(', ')}
      Meeting Types: ${(project.meeting_types || []).join(', ')}
    `;

    // Generate a simple hash for content checking
    const contentHash = btoa(projectContext).slice(0, 12);

    // Check if we already have an embedding for this content hash
    const { data: existingEmbedding, error: embeddingError } = await supabase
      .from('project_embeddings')
      .select('*')
      .eq('project_id', projectId)
      .eq('content_hash', contentHash)
      .eq('field_type', 'full')
      .maybeSingle();

    if (!existingEmbedding) {
      console.log('No embedding found, generating...');
      await generateProjectEmbeddings(projectId);
    } else {
      console.log('Embedding already exists, skipping...');
    }
  } catch (error) {
    console.error('Error in ensureProjectEmbeddings:', error);
  }
};
