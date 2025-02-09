
import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { AudioControlBar } from "@/components/notes/AudioControlBar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { MoveNoteDialog } from "@/components/notes/MoveNoteDialog";
import { NoteHeader } from "@/components/notes/NoteHeader";
import { NoteContent } from "@/components/notes/NoteContent";
import { TagsDialog } from "@/components/notes/TagsDialog";
import { useNoteData } from "@/hooks/useNoteData";
import { useNoteOperations } from "@/components/notes/NoteOperations";
import { supabase } from "@/integrations/supabase/client";

const NotePage = () => {
  const { noteId } = useParams();
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const { note, isLoadingNote, folders, currentFolder } = useNoteData();
  const { moveNoteToFolder, addTagToNote, deleteNote, renameNote } = useNoteOperations(noteId || '');

  useEffect(() => {
    const loadAudioUrl = async () => {
      if (note?.audio_url) {
        try {
          const { data: { publicUrl } } = supabase
            .storage
            .from('audio_recordings')
            .getPublicUrl(note.audio_url);
          
          console.log("Public URL:", publicUrl);
          setAudioUrl(publicUrl);
        } catch (error) {
          console.error("Error getting audio URL:", error);
        }
      }
    };

    loadAudioUrl();
  }, [note?.audio_url]);

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  if (!noteId) {
    return <div>Note ID is required</div>;
  }

  if (isLoadingNote || !note) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-gray-50">
          <AppSidebar activePage="notes" />
          <main className="flex-1 p-8">
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  // Log para debug
  console.log("Note data:", note);
  console.log("Audio URL:", audioUrl);

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 overflow-auto">
          <AudioControlBar
            audioUrl={audioUrl}
            isPlaying={isPlaying}
            onPlayPause={handlePlayPause}
          />
          <div className="max-w-5xl mx-auto px-6 py-8 mt-14">
            <NoteHeader
              title={note.title}
              createdAt={note.created_at}
              duration={note.duration}
              audioUrl={audioUrl}
              isPlaying={isPlaying}
              onPlayPause={handlePlayPause}
              onRenameNote={renameNote}
              onOpenTagsDialog={() => setIsTagsDialogOpen(true)}
              onOpenMoveDialog={() => setIsMoveDialogOpen(true)}
              onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
            />
            
            <div className="mt-8">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <NoteContent note={note} />
              </div>
            </div>

            {audioUrl && (
              <audio
                ref={audioRef}
                src={audioUrl}
                onEnded={() => setIsPlaying(false)}
                style={{ display: 'none' }}
              />
            )}

            <MoveNoteDialog
              isOpen={isMoveDialogOpen}
              onOpenChange={setIsMoveDialogOpen}
              folders={folders || []}
              currentFolderId={currentFolder?.folder_id || null}
              onMoveToFolder={moveNoteToFolder}
            />

            <TagsDialog
              isOpen={isTagsDialogOpen}
              onOpenChange={setIsTagsDialogOpen}
              onAddTag={addTagToNote}
              selectedTags={selectedTags}
            />

            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Note</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this note? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={deleteNote}>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NotePage;
