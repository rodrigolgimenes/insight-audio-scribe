
import { supabase } from '@/integrations/supabase/client';
import { logData } from '@/lib/logger';

/**
 * Generate embeddings for a project
 * Creates or updates the vector embedding in the database
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
    logData(`Generated content hash: ${contentHash}`);
    
    // Check if we already have an embedding for this content hash and field type
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

    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available. User might not be authenticated.');
      return {
        success: false,
        message: 'Authentication required'
      };
    }

    // Call the edge function to generate the embedding with authorization header
    const { data: result, error: invokeError } = await supabase.functions.invoke('vectorize-project', {
      body: { 
        project_id: projectId,
        forceUpdate: force,
        content: projectContext,
        contentHash: contentHash,
        fieldType: 'full'
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
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
    // Get the current session for authentication
    const { data: { session } } = await supabase.auth.getSession();
    const accessToken = session?.access_token;
    
    if (!accessToken) {
      console.error('No access token available. User might not be authenticated.');
      return [];
    }

    // Call the classify-transcription function directly with the search text
    const { data: similarProjects, error: similarError } = await supabase.functions.invoke('classify-transcription', {
      body: {
        noteContent: searchText,
        threshold,
        limit
      },
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    if (similarError) {
      console.error('Error finding similar projects:', similarError);
      return [];
    }

    return similarProjects?.classifications || [];
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
