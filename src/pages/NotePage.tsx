
import { useState, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
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
import { NoteTags } from "@/components/notes/NoteTags";
import { useQuery } from "@tanstack/react-query";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const { note, isLoadingNote, folders, currentFolder, tags } = useNoteData();
  const { moveNoteToFolder, addTagToNote, deleteNote, renameNote } = useNoteOperations(noteId || '');

  // Fetch meeting minutes with improved caching
  const { data: meetingMinutes, isLoading: isLoadingMinutes } = useQuery({
    queryKey: ['meeting-minutes', noteId],
    queryFn: async () => {
      console.log('Fetching meeting minutes for note:', noteId);
      const { data, error } = await supabase
        .from('meeting_minutes')
        .select('content')
        .eq('note_id', noteId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching meeting minutes:', error);
        throw error;
      }

      console.log('Meeting minutes data:', data);
      return data?.content || null;
    },
    enabled: !!noteId,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false
  });

  useEffect(() => {
    const loadAudioUrl = async () => {
      if (note?.audio_url) {
        try {
          console.log("Original audio_url:", note.audio_url);
          const { data: { publicUrl } } = supabase
            .storage
            .from('audio_recordings')
            .getPublicUrl(note.audio_url);
          
          console.log("Generated publicUrl:", publicUrl);
          setAudioUrl(publicUrl);
        } catch (error) {
          console.error("Error getting audio URL:", error);
        }
      }
    };

    loadAudioUrl();
  }, [note?.audio_url]);

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

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <div className="flex-1 flex flex-col">
          <main className="flex-1 overflow-auto">
            <div className="max-w-5xl mx-auto px-6 py-8">
              <NoteHeader
                title={note.title}
                createdAt={note.created_at}
                duration={note.duration}
                folder={currentFolder}
                onRenameNote={renameNote}
                onOpenTagsDialog={() => setIsTagsDialogOpen(true)}
                onOpenMoveDialog={() => setIsMoveDialogOpen(true)}
                onOpenDeleteDialog={() => setIsDeleteDialogOpen(true)}
              />
              
              {noteId && <NoteTags noteId={noteId} />}

              <div className="mt-8">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                  <NoteContent 
                    note={note}
                    meetingMinutes={meetingMinutes}
                    isLoadingMinutes={isLoadingMinutes}
                  />
                </div>
              </div>
            </div>
          </main>

          <MoveNoteDialog
            isOpen={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            folders={folders || []}
            currentFolderId={currentFolder?.id || null}
            onMoveToFolder={moveNoteToFolder}
          />

          <TagsDialog
            isOpen={isTagsDialogOpen}
            onOpenChange={setIsTagsDialogOpen}
            onAddTag={addTagToNote}
            selectedTags={tags?.map(tag => tag.id) || []}
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
      </div>
    </SidebarProvider>
  );
};

export default NotePage;
