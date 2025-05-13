
import { useState } from 'react';
import { 
  generateProjectEmbeddings, 
  findSimilarProjects, 
  ensureProjectEmbeddings 
} from '@/utils/embeddings/projectEmbeddings';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for managing project embeddings
 */
export function useProjectEmbeddings() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [similarProjects, setSimilarProjects] = useState<Array<{ projectId: string; similarity: number; projectName?: string }>>([]);

  /**
   * Generate embeddings for a project
   */
  const generateEmbeddings = async (projectId: string, showToasts: boolean = true) => {
    setIsProcessing(true);
    
    try {
      const result = await generateProjectEmbeddings(projectId, true);
      
      if (result.success && showToasts) {
        toast.success('Project embeddings generation initiated');
      } else if (!result.success && showToasts) {
        toast.error(`Failed to generate embeddings: ${result.message}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error in generateEmbeddings:', error);
      if (showToasts) {
        toast.error(`Error generating embeddings: ${error.message || 'Unknown error'}`);
      }
      return { success: false, message: error.message || 'Unknown error' };
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Find projects similar to the provided text
   */
  const searchSimilarProjects = async (
    searchText: string, 
    threshold: number = 0.7,
    limit: number = 5
  ) => {
    setIsProcessing(true);
    
    try {
      const results = await findSimilarProjects(searchText, threshold, limit);
      setSimilarProjects(results);
      return results;
    } catch (error) {
      console.error('Error searching similar projects:', error);
      setSimilarProjects([]);
      return [];
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Ensure a project has embeddings generated
   * Called automatically when viewing a project
   */
  const ensureEmbeddings = async (projectId: string) => {
    if (!projectId) return;
    
    try {
      await ensureProjectEmbeddings(projectId);
    } catch (error) {
      console.error('Error ensuring project embeddings:', error);
    }
  };

  /**
   * Classify a note into relevant projects
   */
  const classifyNote = async (noteId: string) => {
    if (!noteId) return null;
    
    setIsProcessing(true);
    
    try {
      // Get the current session for authentication
      const { data: { session } } = await supabase.auth.getSession();
      const accessToken = session?.access_token;
      
      if (!accessToken) {
        console.error('No access token available. User might not be authenticated.');
        toast.error('Authentication required to classify notes');
        return null;
      }
      
      const { data, error } = await supabase.functions.invoke('classify-transcription', {
        body: { noteId },
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      });
      
      if (error) {
        console.error('Error classifying note:', error);
        toast.error(`Failed to classify note: ${error.message}`);
        return null;
      }
      
      return data;
    } catch (error) {
      console.error('Error in classifyNote:', error);
      toast.error(`Error classifying note: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    isProcessing,
    similarProjects,
    generateEmbeddings,
    searchSimilarProjects,
    ensureEmbeddings,
    classifyNote
  };
}
