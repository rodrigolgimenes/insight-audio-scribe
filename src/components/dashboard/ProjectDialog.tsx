
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FileText, FolderPlus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

interface ProjectDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  projects: any[];
  currentProjectId: string | null;
  newProjectName: string;
  onNewProjectNameChange: (value: string) => void;
  onCreateNewProject: () => void;
  onSelectProject: (projectId: string) => void;
}

export const ProjectDialog = ({
  isOpen,
  onOpenChange,
  projects,
  currentProjectId,
  newProjectName,
  onNewProjectNameChange,
  onCreateNewProject,
  onSelectProject,
}: ProjectDialogProps) => {
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
            <Input
              placeholder="New project name"
              value={newProjectName}
              onChange={(e) => onNewProjectNameChange(e.target.value)}
            />
            <Button
              className="w-full"
              variant="outline"
              onClick={onCreateNewProject}
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Create new project
            </Button>
          </div>
          {projects?.map((project) => (
            <div
              key={project.id}
              className="flex items-center justify-between p-2 rounded-lg border"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span>{project.name}</span>
                {project.id === currentProjectId && (
                  <Badge variant="secondary">Current project</Badge>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                disabled={project.id === currentProjectId}
                onClick={() => onSelectProject(project.id)}
              >
                Move here
              </Button>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
};
