
import { useState } from "react";
import { useProjectEmbeddings } from "@/hooks/useProjectEmbeddings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function ProjectSimilaritySearch() {
  const [searchText, setSearchText] = useState("");
  const { isProcessing, similarProjects, searchSimilarProjects } = useProjectEmbeddings();
  const navigate = useNavigate();
  
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchText.trim()) {
      await searchSimilarProjects(searchText);
    }
  };

  const navigateToProject = (projectId: string) => {
    navigate(`/app/projects/${projectId}`);
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSearch} className="flex gap-2 mb-4">
        <Input
          value={searchText}
          onChange={(e) => setSearchText(e.target.value)}
          placeholder="Describe what you're looking for..."
          className="flex-grow"
        />
        <Button 
          type="submit" 
          disabled={isProcessing || !searchText.trim()}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            'Search'
          )}
        </Button>
      </form>

      {similarProjects.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Similar projects:</h3>
          {similarProjects.map((project) => (
            <Card 
              key={project.projectId} 
              className="p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => navigateToProject(project.projectId)}
            >
              <div className="flex justify-between items-center">
                <span>{project.projectId}</span>
                <span className="text-sm text-gray-500">
                  {Math.round(project.similarity * 100)}% match
                </span>
              </div>
            </Card>
          ))}
        </div>
      ) : null}

      {isProcessing && similarProjects.length === 0 && (
        <div className="text-center py-4 text-gray-500">
          <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
          Searching for similar projects...
        </div>
      )}

      {!isProcessing && similarProjects.length === 0 && searchText && (
        <div className="text-center py-4 text-gray-500">
          No similar projects found
        </div>
      )}
    </div>
  );
}
