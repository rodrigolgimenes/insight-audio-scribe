
import { Button } from "@/components/ui/button";
import { Folder } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface MoveNoteDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  currentProjectId: string | null;
  onMoveToProject: (projectId: string) => void;
}

export const MoveNoteDialog = ({
  isOpen,
  onOpenChange,
  projects,
  currentProjectId,
  onMoveToProject,
}: MoveNoteDialogProps) => {
  const handleMoveToProject = (projectId: string) => {
    onMoveToProject(projectId);
    onOpenChange(false); // Close the dialog after moving
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Move note to project:</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          {projects?.length === 0 && (
            <p className="text-center text-gray-500">No projects found</p>
          )}
          <div className="space-y-2">
            {projects?.map((project) => {
              const isCurrentProject = project.id === currentProjectId;
              return (
                <div
                  key={project.id}
                  className={`flex items-center justify-between p-2 rounded-lg border ${
                    isCurrentProject ? "bg-gray-50" : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Folder className="w-4 h-4" />
                    <span>{project.name}</span>
                    {isCurrentProject && (
                      <Badge variant="secondary">Current project</Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isCurrentProject}
                    onClick={() => handleMoveToProject(project.id)}
                  >
                    {isCurrentProject ? "Current" : "Move here"}
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
