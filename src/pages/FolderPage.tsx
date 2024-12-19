import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { FileText } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const FolderPage = () => {
  const { folderId } = useParams();
  const navigate = useNavigate();

  const { data: folder, isLoading: folderLoading } = useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: notes, isLoading: notesLoading } = useQuery({
    queryKey: ["folder-notes", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes_folders")
        .select(`
          note:notes (
            id,
            title,
            content,
            created_at
          )
        `)
        .eq("folder_id", folderId);

      if (error) throw error;
      return data.map((item) => item.note);
    },
  });

  const isLoading = folderLoading || notesLoading;

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          {isLoading ? (
            <div>Loading...</div>
          ) : (
            <>
              <h1 className="text-2xl font-bold mb-6">{folder?.name}</h1>
              {notes && notes.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="bg-white p-6 rounded-lg border cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/app/notes/${note.id}`)}
                    >
                      <h3 className="font-medium mb-2">{note.title}</h3>
                      <p className="text-gray-600 text-sm line-clamp-3">
                        {note.content}
                      </p>
                      <div className="mt-4 flex justify-between items-center">
                        <span className="text-xs text-gray-500">
                          {new Date(note.created_at).toLocaleDateString()}
                        </span>
                        <Badge>Note</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
                  <div className="text-center">
                    <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium text-gray-900">No notes in this folder</h3>
                    <p className="text-sm text-gray-500">
                      Move some notes to this folder to see them here.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default FolderPage;