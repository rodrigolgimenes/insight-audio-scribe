import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { RecordingsHeader } from "@/components/recordings/RecordingsHeader";
import { RecordingsGrid } from "@/components/recordings/RecordingsGrid";

const RecordingsPage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  const { data: recordings, isLoading } = useQuery({
    queryKey: ["recordings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("recordings")
        .select(`
          *,
          notes (
            processed_content,
            notes_tags (
              tags (
                name
              )
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const filteredRecordings = recordings?.filter((recording) =>
    recording.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("recordings").delete().eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete recording",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Success",
      description: "Recording deleted successfully",
    });
  };

  const handlePlay = (id: string) => navigate(`/app/notes-record/${id}`);
  const handleEdit = (id: string) => navigate(`/app/notes/${id}/edit`);
  const handleShare = (id: string) => {
    // Implement share functionality
    console.log("Share recording:", id);
  };

  if (isLoading) {
    return (
      <SidebarProvider>
        <div className="flex h-screen w-full">
          <AppSidebar activePage="recordings" />
          <div className="flex-1 p-8">Loading recordings...</div>
        </div>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full">
        <AppSidebar activePage="recordings" />
        <div className="flex-1 overflow-auto bg-gray-50">
          <div className="p-8">
            <RecordingsHeader
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
            <RecordingsGrid
              recordings={filteredRecordings || []}
              onPlay={handlePlay}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
            />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default RecordingsPage;
