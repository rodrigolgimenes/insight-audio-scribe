
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { ClassificationResult, ClassificationResponse } from '@/integrations/supabase/types/notes';

export function useNoteClassification(noteId: string | undefined) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifications, setClassifications] = useState<ClassificationResult[]>([]);
  const [classificationError, setClassificationError] = useState<{
    message: string;
    bestScore?: number;
    threshold?: number;
  } | null>(null);

  const classifyNote = async (threshold: number = 0.7, limit: number = 5) => {
    if (!noteId) return null;
    
    setIsClassifying(true);
    setClassificationError(null);
    
    try {
      console.log('Calling classify-transcription with:', { noteId, threshold, limit });
      
      // Call the edge function with the correct name: classify-transcription
      const { data, error } = await supabase.functions.invoke('classify-transcription', {
        body: { 
          noteId,
          threshold,
          limit 
        }
      });
      
      if (error) {
        console.error('Error classifying note:', error);
        setClassificationError({
          message: `Failed to classify note: ${error.message}`
        });
        toast.error(`Failed to classify note: ${error.message}`);
        return null;
      }
      
      const response = data as ClassificationResponse;
      
      if (response.success && response.classifications && response.classifications.length > 0) {
        // Filter to only show successfully classified items
        const successfulClassifications = response.classifications.filter(
          c => c.status === 'classified'
        );
        
        setClassifications(successfulClassifications);
        
        if (successfulClassifications.length === 0) {
          // We got results but none passed the threshold
          setClassificationError({
            message: "No project matches this note with sufficient confidence",
            bestScore: response.best_score,
            threshold: response.threshold_used
          });
        }
        
        return successfulClassifications;
      } else if (!response.success) {
        setClassificationError({
          message: response.error || "Failed to classify note",
          bestScore: response.best_score,
          threshold: response.threshold_used
        });
        toast.error(`Classification failed: ${response.error || 'Unknown error'}`);
        return null;
      } else if (response.classifications.length === 0) {
        setClassificationError({
          message: "No matching projects found",
          threshold: response.threshold_used
        });
        return [];
      }
      
      return [];
    } catch (error: any) {
      console.error('Error in classifyNote:', error);
      setClassificationError({
        message: `Unexpected error during classification: ${error.message || 'Unknown error'}`
      });
      toast.error(`Unexpected error during classification: ${error.message || 'Unknown error'}`);
      return null;
    } finally {
      setIsClassifying(false);
    }
  };

  // Fetch existing classifications for a note
  const fetchClassifications = async () => {
    if (!noteId) return;
    
    try {
      const { data, error } = await supabase
        .from('notes_projects')
        .select(`
          project_id,
          similarity_score,
          classification_reason,
          classification_method,
          status,
          projects:project_id (
            name,
            description
          )
        `)
        .eq('note_id', noteId)
        .order('similarity_score', { ascending: false });
        
      if (error) {
        console.error('Error fetching classifications:', error);
        return;
      }
      
      if (data && data.length > 0) {
        const formattedClassifications = data.map(item => ({
          project_id: item.project_id,
          project_name: item.projects ? (item.projects as any).name || 'Unknown Project' : 'Unknown Project',
          project_description: item.projects ? (item.projects as any).description || null : null,
          similarity_score: item.similarity_score || 0,
          classification_reason: item.classification_reason || 'Manual classification',
          classification_method: item.classification_method || 'unknown',
          status: item.status || 'classified'
        }));
        
        // Separate successful and failed classifications
        const successfulClassifications = formattedClassifications.filter(c => c.status === 'classified');
        setClassifications(successfulClassifications);
        
        // Check if we have any failed classifications that should be displayed as errors
        const failedClassifications = formattedClassifications.filter(c => c.status === 'processed' || c.status === 'failed');
        if (failedClassifications.length > 0 && successfulClassifications.length === 0) {
          const bestFailed = failedClassifications.reduce((prev, current) => 
            (prev.similarity_score > current.similarity_score) ? prev : current);
          
          setClassificationError({
            message: "No project matches this note with sufficient confidence",
            bestScore: bestFailed.similarity_score
          });
        }
      }
    } catch (error) {
      console.error('Error in fetchClassifications:', error);
    }
  };

  // Remove a classification
  const removeClassification = async (projectId: string) => {
    if (!noteId) return false;
    
    try {
      const { error } = await supabase
        .from('notes_projects')
        .delete()
        .eq('note_id', noteId)
        .eq('project_id', projectId);
        
      if (error) {
        console.error('Error removing classification:', error);
        toast.error(`Failed to remove classification: ${error.message}`);
        return false;
      }
      
      // Update local state
      setClassifications(prev => prev.filter(c => c.project_id !== projectId));
      toast.success('Classification removed successfully');
      return true;
    } catch (error: any) {
      console.error('Error in removeClassification:', error);
      toast.error(`Unexpected error: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  // Manually add a classification
  const addManualClassification = async (projectId: string) => {
    if (!noteId) return false;
    
    try {
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .select('name, description')
        .eq('id', projectId)
        .single();
        
      if (projectError) {
        console.error('Error fetching project details:', projectError);
        toast.error(`Failed to fetch project details: ${projectError.message}`);
        return false;
      }
      
      const { error } = await supabase
        .from('notes_projects')
        .insert({
          note_id: noteId,
          project_id: projectId,
          similarity_score: 1.0, // Manual classifications get highest score
          classification_reason: 'Manual classification',
          classification_method: 'manual',
          status: 'classified',
          classified_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error adding classification:', error);
        toast.error(`Failed to add classification: ${error.message}`);
        return false;
      }
      
      // Update local state
      const newClassification: ClassificationResult = {
        project_id: projectId,
        project_name: project.name || 'Unknown Project',
        project_description: project.description || null,
        similarity_score: 1.0,
        classification_reason: 'Manual classification',
        classification_method: 'manual',
        status: 'classified'
      };
      
      setClassifications(prev => [newClassification, ...prev]);
      setClassificationError(null); // Clear any previous error since we now have a classification
      toast.success('Project added to note successfully');
      return true;
    } catch (error: any) {
      console.error('Error in addManualClassification:', error);
      toast.error(`Unexpected error: ${error.message || 'Unknown error'}`);
      return false;
    }
  };

  return {
    isClassifying,
    classifications,
    classificationError,
    classifyNote,
    fetchClassifications,
    removeClassification,
    addManualClassification
  };
}
