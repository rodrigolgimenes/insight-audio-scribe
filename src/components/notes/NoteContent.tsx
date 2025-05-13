
import { useState } from "react";
import { Note } from "@/integrations/supabase/types/notes";
import { AudioPlayer } from "./AudioPlayer";
import { NoteHeader } from "./NoteHeader";
import { ProcessedContentAccordion } from "./ProcessedContentAccordion";
import { TranscriptAccordion } from "./TranscriptAccordion";
import { TranscriptError } from "./TranscriptError";
import { TranscriptValidation } from "./TranscriptValidation";
import { MeetingMinutes } from "./MeetingMinutes";
import { NoteSummary } from "./NoteSummary";
import { NoteProjectClassifications } from "./NoteProjectClassifications";
import { AddToProjectDialog } from "./AddToProjectDialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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
  const { validTranscript } = TranscriptValidation({ note });

  const handleRenameNote = () => {
    refetchNote();
    // Return Promise.resolve() to satisfy TypeScript
    return Promise.resolve();
  };

  return (
    <div className="space-y-6">
      <NoteHeader
        title={note.title}
        createdAt={note.created_at}
        duration={note.duration}
        folder={null}
        onRenameNote={handleRenameNote}
        onOpenTagsDialog={() => {}}
        onOpenMoveDialog={() => {}}
        onOpenDeleteDialog={() => {}}
      />

      {(audioUrl || note.audio_url) && (
        <AudioPlayer
          audioUrl={audioUrl || note.audio_url || ''}
          isPlaying={false}
          onPlayPause={() => {}}
        />
      )}

      <Tabs defaultValue="content" className="w-full">
        <TabsList className="flex w-full space-x-1 rounded-xl bg-gray-100 p-1">
          <TabsTrigger 
            value="content"
            className="w-full rounded-lg py-2.5 text-sm font-medium leading-5"
          >
            Content
          </TabsTrigger>
          <TabsTrigger 
            value="projects"
            className="w-full rounded-lg py-2.5 text-sm font-medium leading-5"
          >
            Projects
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="mt-2 rounded-xl bg-white p-3">
          {hasTranscriptError && <TranscriptError noteId={note.id} />}

          <div className="space-y-6">
            <ProcessedContentAccordion
              content={note.processed_content}
            />

            <TranscriptAccordion
              transcript={note.original_transcript || ""}
              noteId={note.id}
            />

            <MeetingMinutes 
              transcript={note.original_transcript || ""}
              noteId={note.id}
              audioUrl={audioUrl || note.audio_url}
              initialContent={meetingMinutes}
              isLoadingInitialContent={isLoadingMinutes}
            />
            
            <NoteSummary noteId={note.id} />
          </div>
        </TabsContent>
        
        <TabsContent value="projects" className="mt-2 rounded-xl bg-white p-3">
          <NoteProjectClassifications 
            noteId={note.id} 
            onAddToProject={() => setIsAddToProjectDialogOpen(true)}
          />
        </TabsContent>
      </Tabs>

      <AddToProjectDialog 
        noteId={note.id}
        isOpen={isAddToProjectDialogOpen}
        onOpenChange={setIsAddToProjectDialogOpen}
      />
    </div>
  );
}
