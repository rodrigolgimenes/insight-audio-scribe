
import React from "react";
import { Button } from "@/components/ui/button";
import { EditIcon, Trash2Icon, ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useProjectOperations } from "@/hooks/project/useProjectOperations";
import { ProjectEmbeddingsManager } from "@/components/projects/ProjectEmbeddingsManager"; 

interface ProjectHeaderProps {
  projectName: string;
  projectId: string;
  description?: string;
  onRename?: () => void;
  onDelete?: () => void;
  isRenaming?: boolean;
  isDeleting?: boolean;
}

export const ProjectHeader = ({
  projectName,
  projectId,
  description,
  onRename,
  onDelete,
  isRenaming,
  isDeleting,
}: ProjectHeaderProps) => {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={() => navigate("/app")}
            variant="ghost"
            size="icon"
            className="h-8 w-8"
          >
            <ArrowLeftIcon className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Button>
          <div>
            <h1 className="text-xl font-bold text-gray-800">{projectName}</h1>
            {description && (
              <p className="text-sm text-gray-500">{description}</p>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Add the embeddings manager */}
          <ProjectEmbeddingsManager projectId={projectId} />
          
          {/* Edit button */}
          {onRename && (
            <Button
              onClick={onRename}
              variant="outline"
              size="sm"
              className="flex items-center gap-1"
              disabled={isRenaming}
            >
              <EditIcon className="h-3.5 w-3.5" />
              {isRenaming ? "Renaming..." : "Edit"}
            </Button>
          )}
          
          {/* Delete button */}
          {onDelete && (
            <Button
              onClick={onDelete}
              variant="outline"
              size="sm"
              className="flex items-center gap-1 border-red-200 hover:bg-red-50 hover:text-red-600"
              disabled={isDeleting}
            >
              <Trash2Icon className="h-3.5 w-3.5" />
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
