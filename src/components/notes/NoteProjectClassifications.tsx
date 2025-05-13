
import { useState, useEffect } from 'react';
import { useNoteClassification } from '@/hooks/useNoteClassification';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Trash2, Plus, RefreshCw, Sparkles, MoveRight, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

interface NoteProjectClassificationsProps {
  noteId: string;
  onAddToProject?: () => void;
}

export function NoteProjectClassifications({ noteId, onAddToProject }: NoteProjectClassificationsProps) {
  const queryClient = useQueryClient();
  const {
    isClassifying,
    classifications,
    classificationError,
    classifyNote,
    fetchClassifications,
    removeClassification
  } = useNoteClassification(noteId);
  const [threshold, setThreshold] = useState(0.7);

  useEffect(() => {
    if (noteId) {
      fetchClassifications();
    }
  }, [noteId, fetchClassifications]);

  const handleClassify = async () => {
    await classifyNote(threshold);
    // Invalidate relevant queries to refresh data
    queryClient.invalidateQueries({ queryKey: ["note-project", noteId] });
    toast.success('Note classification process completed');
  };

  const handleRemoveClassification = async (projectId: string) => {
    const success = await removeClassification(projectId);
    if (success) {
      // Invalidate relevant queries to refresh data
      queryClient.invalidateQueries({ queryKey: ["note-project", noteId] });
    }
  };

  const formatScore = (score: number) => {
    return (score * 100).toFixed(0) + '%';
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Project Classifications</h3>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleClassify}
            disabled={isClassifying}
          >
            {isClassifying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Classifying...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Auto-Classify
              </>
            )}
          </Button>
          {onAddToProject && (
            <Button 
              size="sm"
              variant="outline"
              onClick={onAddToProject}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add to Project
            </Button>
          )}
        </div>
      </div>

      {/* Classification Error Alert */}
      {classificationError && !isClassifying && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Classification not completed</AlertTitle>
          <AlertDescription>
            <p className="mb-1">{classificationError.message}</p>
            {classificationError.bestScore !== undefined && (
              <p className="text-sm">
                Maximum similarity found: {formatScore(classificationError.bestScore)}
                {classificationError.threshold !== undefined && (
                  <> (minimum required: {formatScore(classificationError.threshold)})</>
                )}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {classifications.length > 0 ? (
        <div className="space-y-2">
          {classifications.map((classification) => (
            <Card key={classification.project_id} className="p-3">
              <div className="flex justify-between items-center">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{classification.project_name}</h4>
                    <Badge variant={classification.similarity_score > 0.8 ? "default" : "secondary"}>
                      {formatScore(classification.similarity_score)}
                    </Badge>
                    {classification.classification_method && (
                      <Badge variant="outline" className="text-xs">
                        {classification.classification_method === 'embedding' ? 'AI Match' : 
                         classification.classification_method === 'gpt' ? 'GPT Analysis' : 
                         classification.classification_method === 'manual' ? 'Manual' : 
                         'Auto'}
                      </Badge>
                    )}
                  </div>
                  {classification.project_description && (
                    <p className="text-sm text-gray-500 line-clamp-1">{classification.project_description}</p>
                  )}
                  <p className="text-xs text-gray-400">{classification.classification_reason}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => handleRemoveClassification(classification.project_id)}
                  >
                    <Trash2 className="h-4 w-4 text-gray-500 hover:text-red-500" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    asChild
                  >
                    <a href={`/app/project/${classification.project_id}`} target="_blank">
                      <MoveRight className="h-4 w-4 text-gray-500" />
                    </a>
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : !classificationError ? (
        <div className="text-center py-6 border rounded-md bg-gray-50">
          <p className="text-gray-500">No classifications yet</p>
          <p className="text-sm text-gray-400 mt-1">Click "Auto-Classify" to find relevant projects</p>
        </div>
      ) : null}
    </div>
  );
}
