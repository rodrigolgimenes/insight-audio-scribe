
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import { Search, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNoteClassification } from '@/hooks/useNoteClassification';
import { useQueryClient } from '@tanstack/react-query';

interface Project {
  id: string;
  name: string;
  description: string | null;
}

interface AddToProjectDialogProps {
  noteId: string;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToProjectDialog({
  noteId,
  isOpen,
  onOpenChange
}: AddToProjectDialogProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { addManualClassification } = useNoteClassification(noteId);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (isOpen) {
      fetchProjects();
    }
  }, [isOpen]);

  const fetchProjects = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('projects')
        .select('id, name, description')
        .order('name');
        
      if (error) {
        console.error('Error fetching projects:', error);
        return;
      }
      
      setProjects(data || []);
    } catch (error) {
      console.error('Error in fetchProjects:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToProject = async (projectId: string) => {
    const success = await addManualClassification(projectId);
    if (success) {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["note-project", noteId] });
      onOpenChange(false);
    }
  };

  const filteredProjects = searchQuery.trim() 
    ? projects.filter(p => 
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (p.description && p.description.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : projects;

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Note to Project</DialogTitle>
          <DialogDescription>
            Select a project to add this note to.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex items-center border rounded-md px-3 py-2 mb-4">
          <Search className="h-4 w-4 mr-2 text-gray-400" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search projects..."
            className="border-0 p-0 focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
        
        <ScrollArea className="h-72">
          {isLoading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          ) : filteredProjects.length > 0 ? (
            <div className="space-y-2">
              {filteredProjects.map((project) => (
                <Card 
                  key={project.id} 
                  className="p-3 cursor-pointer hover:bg-gray-50"
                  onClick={() => handleAddToProject(project.id)}
                >
                  <div className="flex justify-between items-center">
                    <div className="space-y-1">
                      <h4 className="font-medium">{project.name}</h4>
                      {project.description && (
                        <p className="text-sm text-gray-500 line-clamp-2">{project.description}</p>
                      )}
                    </div>
                    <Button variant="ghost" size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500">No projects found</p>
            </div>
          )}
        </ScrollArea>
        
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
