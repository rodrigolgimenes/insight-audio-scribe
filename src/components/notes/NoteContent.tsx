
import { useState } from "react";
import { Note } from "@/integrations/supabase/types/notes";
import { AudioPlayer } from "./AudioPlayer";
import { ProcessedContentAccordion } from "./ProcessedContentAccordion";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptError } from "./TranscriptError";
import { TranscriptValidation } from "./TranscriptValidation";
import { MeetingMinutes } from "./MeetingMinutes";
import { NoteSummary } from "./NoteSummary";
import { NoteProjectClassifications } from "./NoteProjectClassifications";
import { AddToProjectDialog } from "./AddToProjectDialog";
import { TranscriptChat } from "./TranscriptChat";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import { MeetingMinutesContent } from "./content/MeetingMinutesContent";

interface NoteContentProps {
  note: Note;
  hasTranscriptError?: boolean;
  refetchNote?: () => void;
  audioUrl?: string | null;
  meetingMinutes?: string | null;
  isLoadingMinutes?: boolean;
}

export function NoteContent({ 
  note, 
  hasTranscriptError = false, 
  refetchNote = () => {}, 
  audioUrl = null,
  meetingMinutes = null,
  isLoadingMinutes = false
}: NoteContentProps) {
  const [isAddToProjectDialogOpen, setIsAddToProjectDialogOpen] = useState(false);
  const [isEditingMinutes, setIsEditingMinutes] = useState(false);
  const { validTranscript } = TranscriptValidation({ note });

  const handleOpenMinutesEditor = () => {
    setIsEditingMinutes(true);
  };

  return (
    <div className="space-y-8">
      {/* Project Actions Section (Sticky) */}
      <div className="sticky top-0 z-10 bg-white p-4 shadow-sm rounded-lg border border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={() => {
              // Auto-classify functionality would go here
            }}
          >
            <Sparkles className="h-4 w-4" />
            Auto-Classify
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsAddToProjectDialogOpen(true)}
          >
            + Add to Project
          </Button>
        </div>
      </div>

      {/* Audio Player */}
      {(audioUrl || note.audio_url) && (
        <div className="mb-8">
          <AudioPlayer
            audioUrl={audioUrl || note.audio_url || ''}
            isPlaying={false}
            onPlayPause={() => {}}
          />
        </div>
      )}

      {/* Meeting Minutes Section */}
      {isEditingMinutes ? (
        <MeetingMinutes 
          transcript={note.original_transcript || ""}
          noteId={note.id}
          audioUrl={audioUrl || note.audio_url}
          initialContent={meetingMinutes}
          isLoadingInitialContent={isLoadingMinutes}
          onClose={() => setIsEditingMinutes(false)}
        />
      ) : (
        <MeetingMinutesContent
          content={meetingMinutes}
          onEdit={handleOpenMinutesEditor}
          isLoading={isLoadingMinutes}
        />
      )}

      {/* Original Transcript Section */}
      <div className="space-y-6">
        {hasTranscriptError && <TranscriptError noteId={note.id} />}
        
        <TranscriptAccordion
          transcript={note.original_transcript || ""}
          noteId={note.id}
        />
      </div>

      {/* Chat with Transcript */}
      <div className="mt-8">
        <TranscriptChat note={note} />
      </div>

      {/* Hidden until needed - these sections can be conditionally shown based on user requirements */}
      <div className="hidden">
        <ProcessedContentAccordion content={note.processed_content} />
        <NoteSummary noteId={note.id} />
      </div>

      {/* Dialog for adding to project */}
      <AddToProjectDialog 
        noteId={note.id}
        isOpen={isAddToProjectDialogOpen}
        onOpenChange={setIsAddToProjectDialogOpen}
      />
    </div>
  );
}
