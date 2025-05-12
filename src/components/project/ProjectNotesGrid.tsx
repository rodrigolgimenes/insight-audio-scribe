
import { useState } from "react";
import { Link } from "react-router-dom";
import { Note } from "@/integrations/supabase/types/notes";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { CheckSquare, Clock, Tag, File } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface ProjectNotesGridProps {
  notes: Note[];
  isSelectionMode: boolean;
  selectedNotes: string[];
  toggleNoteSelection: (noteId: string) => void;
}

export const ProjectNotesGrid = ({
  notes,
  isSelectionMode,
  selectedNotes,
  toggleNoteSelection,
}: ProjectNotesGridProps) => {
  // Query to get classification metadata for all notes
  const { data: classificationsData } = useQuery({
    queryKey: ["project-notes-classifications", notes.map(n => n.id)],
    queryFn: async () => {
      if (!notes.length) return {};
      
      // Get note IDs
      const noteIds = notes.map(note => note.id);
      
      // Fetch classifications for all notes in one query
      const { data } = await supabase
        .from('notes_projects')
        .select('note_id, similarity_score, classification_reason')
        .in('note_id', noteIds);
        
      // Transform into a map for easy access
      const classificationMap: Record<string, { score: number, reason: string }> = {};
      if (data) {
        data.forEach(item => {
          if (item.note_id && (item.similarity_score !== null)) {
            classificationMap[item.note_id] = { 
              score: item.similarity_score,
              reason: item.classification_reason || 'Auto-classified' 
            };
          }
        });
      }
      
      return classificationMap;
    },
    enabled: notes.length > 0
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
      {notes.map((note) => {
        const isSelected = selectedNotes.includes(note.id);
        
        // Get classification metadata for this note if available
        const classification = classificationsData?.[note.id];
        const isAutoClassified = classification && 
                                classification.score < 1.0 && 
                                classification.reason !== 'Manual classification';
        
        return (
          <Card 
            key={note.id}
            className={cn(
              "overflow-hidden hover:shadow-md transition-all border",
              isSelected && "ring-2 ring-primary bg-gray-50",
              isAutoClassified && "border-blue-300"
            )}
          >
            {isSelectionMode && (
              <div
                className="absolute top-2 right-2 p-1"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleNoteSelection(note.id);
                }}
              >
                <CheckSquare
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-primary" : "text-gray-300"
                  )}
                />
              </div>
            )}
            
            <Link to={`/app/notes/${note.id}`}>
              <CardContent className="p-4">
                <div className="flex flex-col h-full">
                  <div className="mb-2 flex justify-between items-start">
                    <h3 className="font-medium line-clamp-1 pr-6">
                      {note.title}
                    </h3>
                    
                    {isAutoClassified && (
                      <Badge 
                        className="ml-2 text-xs bg-blue-100 text-blue-800 hover:bg-blue-200" 
                        variant="secondary"
                      >
                        Auto
                      </Badge>
                    )}
                  </div>
                  
                  {note.original_transcript && (
                    <p className="text-sm text-gray-600 line-clamp-2 mb-auto">
                      {note.original_transcript.substring(0, 120)}...
                    </p>
                  )}
                  
                  {isAutoClassified && (
                    <div className="mt-2 text-xs text-gray-500 border-t pt-1">
                      <Badge variant="outline" className="bg-transparent">
                        {Math.round(classification.score * 100)}% match
                      </Badge>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center">
                      <File className="h-3 w-3 mr-1" />
                      <span>Note</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 mr-1" />
                      <span>
                        {formatDistanceToNow(new Date(note.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
