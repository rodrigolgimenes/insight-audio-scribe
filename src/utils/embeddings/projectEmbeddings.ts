
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

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
      return { 
        success: false, 
        message: `Failed to generate embeddings: ${error.message}` 
      };
    }
    
    console.log('Embedding generation response:', data);
    
    return { 
      success: true, 
      message: data.message || 'Embedding generation initiated successfully' 
    };
  } catch (error) {
    console.error('Error in generateProjectEmbeddings:', error);
    return { 
      success: false, 
      message: `Unexpected error: ${error.message || 'Unknown error'}` 
    };
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
): Promise<Array<{ projectId: string; similarity: number }>> {
  try {
    const { data, error } = await supabase.rpc(
      'find_similar_projects',
      {
        search_text: searchText,
        similarity_threshold: threshold,
        max_results: limit
      }
    );
    
    if (error) {
      console.error('Error finding similar projects:', error);
      return [];
    }
    
    return (data || []).map(result => ({
      projectId: result.project_id,
      similarity: result.similarity
    }));
  } catch (error) {
    console.error('Error in findSimilarProjects:', error);
    return [];
  }
}
