
import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProjectDetailsProps {
  project: {
    id: string;
    name: string;
    description?: string | null;
    scope?: string | null;
    objective?: string | null;
    business_area?: string[] | null;
    key_terms?: string[] | null;
    user_role?: string | null;
    meeting_types?: string[] | null;
  };
}

export const ProjectDetails = ({ project }: ProjectDetailsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasAdditionalDetails = project.scope || 
    project.objective || 
    (project.business_area && project.business_area.length > 0) || 
    (project.key_terms && project.key_terms.length > 0) || 
    project.user_role || 
    (project.meeting_types && project.meeting_types.length > 0);

  if (!hasAdditionalDetails) {
    return null;
  }

  return (
    <div className="mb-6 bg-white rounded-lg shadow-sm">
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h3 className="font-medium text-gray-800">Project Details</h3>
        {isExpanded ? (
          <ChevronUp className="h-5 w-5 text-gray-500" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-500" />
        )}
      </div>
      
      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {project.scope && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Project Scope</h4>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{project.scope}</p>
              </div>
            )}
            
            {project.objective && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Project Objective</h4>
                <p className="mt-1 text-gray-800 whitespace-pre-line">{project.objective}</p>
              </div>
            )}

            {project.user_role && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Your Role</h4>
                <p className="mt-1 text-gray-800">{project.user_role}</p>
              </div>
            )}
            
            {project.business_area && project.business_area.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Business Areas</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.business_area.map((area) => (
                    <Badge key={area} variant="outline" className="bg-blue-50">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {project.key_terms && project.key_terms.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Key Terms</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.key_terms.map((term) => (
                    <Badge key={term} variant="outline" className="bg-green-50">
                      {term}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            
            {project.meeting_types && project.meeting_types.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-gray-500">Meeting Types</h4>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.meeting_types.map((type) => (
                    <Badge key={type} variant="outline" className="bg-purple-50">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
