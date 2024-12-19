import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const NotePage = () => {
  const { noteId } = useParams();
  const navigate = useNavigate();

  const { data: note, isLoading } = useQuery({
    queryKey: ["note", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .eq("id", noteId)
        .single();

      if (error) throw error;
      return data;
    },
  });

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <div className="mb-6">
            <Button
              variant="ghost"
              className="gap-2"
              onClick={() => navigate("/app")}
            >
              <ArrowLeft className="w-4 h-4" />
              Back to notes
            </Button>
          </div>
          <div className="max-w-3xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">{note?.title}</h1>
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <p className="whitespace-pre-wrap">{note?.content}</p>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NotePage;