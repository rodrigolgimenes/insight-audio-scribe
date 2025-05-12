
import { useState } from "react";
import { Tab } from "@headlessui/react";
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

  return (
    <div className="space-y-6">
      <NoteHeader
        title={note.title}
        createdAt={note.created_at}
        duration={note.duration}
        folder={null}
        onRenameNote={() => refetchNote()}
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

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-100 p-1">
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-700"
              }`
            }
          >
            Content
          </Tab>
          <Tab
            className={({ selected }) =>
              `w-full rounded-lg py-2.5 text-sm font-medium leading-5 ring-white ring-opacity-60 ring-offset-2 ring-offset-blue-400 focus:outline-none focus:ring-2 ${
                selected
                  ? "bg-white shadow text-blue-700"
                  : "text-gray-700 hover:bg-white/[0.12] hover:text-blue-700"
              }`
            }
          >
            Projects
          </Tab>
        </Tab.List>
        <Tab.Panels className="mt-2">
          <Tab.Panel className="rounded-xl bg-white p-3">
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
                transcript={note.original_transcript}
                noteId={note.id}
                audioUrl={audioUrl || note.audio_url}
                initialContent={meetingMinutes}
                isLoadingInitialContent={isLoadingMinutes}
              />
              
              <NoteSummary noteId={note.id} />
            </div>
          </Tab.Panel>
          <Tab.Panel className="rounded-xl bg-white p-3">
            <NoteProjectClassifications 
              noteId={note.id} 
              onAddToProject={() => setIsAddToProjectDialogOpen(true)}
            />
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>

      <AddToProjectDialog 
        noteId={note.id}
        isOpen={isAddToProjectDialogOpen}
        onOpenChange={setIsAddToProjectDialogOpen}
      />
    </div>
  );
}
