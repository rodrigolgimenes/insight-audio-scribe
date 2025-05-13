
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
      {/* Audio Player */}
      {(audioUrl || note.audio_url) && (
        <div className="mb-6">
          <AudioPlayer
            audioUrl={audioUrl || note.audio_url || ''}
            isPlaying={false}
            onPlayPause={() => {}}
          />
        </div>
      )}

      {/* Project Classification Section */}
      <div className="mb-8">
        <NoteProjectClassifications 
          noteId={note.id}
          onAddToProject={() => setIsAddToProjectDialogOpen(true)}
        />
      </div>

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
      <div className="space-y-6 mt-8">
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
