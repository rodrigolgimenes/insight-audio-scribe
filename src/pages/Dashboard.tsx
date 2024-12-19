import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileText, Search } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

const Dashboard = () => {
  const navigate = useNavigate();

  const { data: notes, isLoading } = useQuery({
    queryKey: ["notes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notes")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My notes:</h1>
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                type="search"
                placeholder="Search notes..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex items-center gap-4 mb-8">
            <div className="flex gap-2">
              <Badge variant="secondary">note</Badge>
              <Badge variant="secondary">tasklist</Badge>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Select notes</span>
              <Switch />
            </div>
          </div>

          {isLoading ? (
            <div>Loading...</div>
          ) : notes && notes.length > 0 ? (
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
                <h3 className="text-lg font-medium text-gray-900">No notes</h3>
                <p className="text-sm text-gray-500 mb-4">
                  Get started by creating a new note.
                </p>
                <Button
                  className="bg-[#E91E63] hover:bg-[#D81B60]"
                  onClick={() => navigate("/record")}
                >
                  + New Note
                </Button>
              </div>
            </div>
          )}
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;