
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
import { useToast } from "@/components/ui/use-toast";
import { Loader2, AlertCircle } from "lucide-react";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();
  const [isMoveDialogOpen, setIsMoveDialogOpen] = useState(false);
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const hasMountedRef = useRef(false);

  // Add validation check for noteId format
  const isValidUUID = noteId ? /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(noteId) : false;

  useEffect(() => {
    // This check runs once on component mount
    if (!hasMountedRef.current) {
      console.log("NotePage mounted with noteId:", noteId);
      
      if (!noteId) {
        toast({
          title: "Error",
          description: "Note ID is required",
          variant: "destructive",
        });
        navigate("/app");
        return;
      }
      
      if (!isValidUUID) {
        console.error("Invalid note ID format:", noteId);
        toast({
          title: "Invalid Note ID",
          description: "The note you're trying to access has an invalid ID format.",
          variant: "destructive",
        });
        navigate("/app");
        return;
      }
      
      hasMountedRef.current = true;
    }
  }, [noteId, isValidUUID, navigate, toast]);

  // Fetch note data with error handling
  const { note, isLoadingNote, tags, projects, currentProject, retryTranscription } = useNoteData();
  const { moveNoteToProject, addTagToNote, deleteNote, renameNote } = useNoteOperations(noteId || '');

  // Fetch audio URL with improved caching and error handling
  const { data: audioUrl, isError: isAudioError } = useQuery({
    queryKey: ['audio-url', note?.audio_url],
    queryFn: async () => {
      if (!note?.audio_url) return null;
      console.log("Fetching audio URL for:", note.audio_url);
      const { data: { publicUrl } } = supabase
        .storage
        .from('audio_recordings')
        .getPublicUrl(note.audio_url);
      return publicUrl;
    },
    enabled: !!note?.audio_url,
    staleTime: Infinity, // Audio URLs don't change, so we can cache them indefinitely
    gcTime: 24 * 60 * 60 * 1000, // Keep in cache for 24 hours
    retry: 2,
    meta: {
      onError: (error) => {
        console.error("Error fetching audio URL:", error);
        toast({
          title: "Audio Unavailable",
          description: "The audio file for this note could not be loaded.",
          variant: "destructive",
        });
      }
    }
  });

  // Fetch meeting minutes with improved caching and error handling
  const { data: meetingMinutes, isLoading: isLoadingMinutes, isError: isMinutesError } = useQuery({
    queryKey: ['meeting-minutes', noteId],
    queryFn: async () => {
      if (!noteId || !isValidUUID) {
        throw new Error("Invalid note ID");
      }
      
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
    enabled: !!noteId && isValidUUID,
    staleTime: 5 * 60 * 1000, // Consider data fresh for 5 minutes
    gcTime: 30 * 60 * 1000, // Keep in cache for 30 minutes
    refetchOnMount: true,
    refetchOnWindowFocus: false,
    retry: 2,
    meta: {
      onError: (error) => {
        console.error("Error fetching meeting minutes:", error);
        // No need to show toast as we'll display fallback content
      }
    }
  });

  if (!noteId || !isValidUUID) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-gray-50">
          <AppSidebar activePage="notes" />
          <main className="flex-1 p-8">
            <div className="flex flex-col items-center justify-center h-full">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-xl font-semibold mb-2">Invalid Note ID</h2>
              <p className="text-gray-600 mb-4">The note you're trying to access doesn't exist or has an invalid ID.</p>
              <button 
                onClick={() => navigate("/app")}
                className="px-4 py-2 bg-primary text-white rounded hover:bg-primary/90"
              >
                Return to Dashboard
              </button>
            </div>
          </main>
        </div>
      </SidebarProvider>
    );
  }

  if (isLoadingNote || !note) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full bg-gray-50">
          <AppSidebar activePage="notes" />
          <main className="flex-1 p-8">
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
              <h2 className="text-xl font-semibold">Loading Note</h2>
              <p className="text-gray-600 mt-2">Please wait while we load your note...</p>
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
                folder={currentProject}
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
                    audioUrl={audioUrl}
                    meetingMinutes={meetingMinutes}
                    isLoadingMinutes={isLoadingMinutes}
                    refetchNote={() => {
                      // We could add a refetch function here if needed
                      return Promise.resolve();
                    }}
                  />
                </div>
              </div>
            </div>
          </main>

          <MoveNoteDialog
            isOpen={isMoveDialogOpen}
            onOpenChange={setIsMoveDialogOpen}
            projects={projects || []}
            currentProjectId={currentProject?.id || null}
            onMoveToProject={moveNoteToProject}
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
