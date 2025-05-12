
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ProjectClassification {
  project_id: string;
  project_name: string;
  project_description: string | null;
  similarity_score: number;
  classification_reason: string;
}

export function useNoteClassification(noteId: string | undefined) {
  const [isClassifying, setIsClassifying] = useState(false);
  const [classifications, setClassifications] = useState<ProjectClassification[]>([]);

  const classifyNote = async (threshold: number = 0.7, limit: number = 5) => {
    if (!noteId) return;
    
    setIsClassifying(true);
    
    try {
      // Call the edge function to classify the note
      const { data, error } = await supabase.functions.invoke('classify-note-to-projects', {
        body: { 
          noteId,
          threshold,
          limit 
        }
      });
      
      if (error) {
        console.error('Error classifying note:', error);
        toast.error(`Failed to classify note: ${error.message}`);
        return null;
      }
      
      if (data?.success && data?.classifications) {
        setClassifications(data.classifications);
        return data.classifications;
      } else if (!data?.success) {
        toast.error(`Failed to classify note: ${data?.error || 'Unknown error'}`);
        return null;
      }
      
      return [];
    } catch (error: any) {
      console.error('Error in classifyNote:', error);
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
          project_name: item.projects ? item.projects.name || 'Unknown Project' : 'Unknown Project',
          project_description: item.projects ? item.projects.description || null : null,
          similarity_score: item.similarity_score || 0,
          classification_reason: item.classification_reason || 'Manual classification'
        }));
        
        setClassifications(formattedClassifications);
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
          classified_at: new Date().toISOString()
        });
        
      if (error) {
        console.error('Error adding classification:', error);
        toast.error(`Failed to add classification: ${error.message}`);
        return false;
      }
      
      // Update local state
      const newClassification: ProjectClassification = {
        project_id: projectId,
        project_name: project.name || 'Unknown Project',
        project_description: project.description || null,
        similarity_score: 1.0,
        classification_reason: 'Manual classification'
      };
      
      setClassifications(prev => [newClassification, ...prev]);
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
    classifyNote,
    fetchClassifications,
    removeClassification,
    addManualClassification
  };
}
