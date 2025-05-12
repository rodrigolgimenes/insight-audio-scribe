
import { useState } from "react";
import { useProjectEmbeddings } from "@/hooks/useProjectEmbeddings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, SearchIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";

type SimilarProject = {
  projectId: string;
  similarity: number;
  projectName?: string;
};

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

  // Format similarity score as percentage
  const formatSimilarity = (score: number) => {
    return `${Math.round(score * 100)}%`;
  };

  // Determine color class based on similarity score
  const getSimilarityColorClass = (score: number) => {
    if (score >= 0.9) return "bg-green-500";
    if (score >= 0.8) return "bg-green-400";
    if (score >= 0.7) return "bg-blue-500";
    if (score >= 0.6) return "bg-blue-400";
    return "bg-gray-500";
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
            <>
              <SearchIcon className="h-4 w-4 mr-2" />
              Search
            </>
          )}
        </Button>
      </form>

      {similarProjects.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium text-gray-500">Similar projects:</h3>
          {(similarProjects as SimilarProject[]).map((project) => (
            <Card 
              key={project.projectId} 
              className="p-3 cursor-pointer hover:bg-gray-50"
              onClick={() => navigateToProject(project.projectId)}
            >
              <div className="flex justify-between items-center">
                <span className="font-medium">
                  {project.projectName || project.projectId.substring(0, 8) + '...'}
                </span>
                <Badge className={getSimilarityColorClass(project.similarity)}>
                  {formatSimilarity(project.similarity)} match
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      )}

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
