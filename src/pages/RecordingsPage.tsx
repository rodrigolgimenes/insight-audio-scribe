import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Pencil, Trash2, Share2, Clock, Calendar } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from "date-fns";

interface Note {
  processed_content: string;
}

interface Tag {
  name: string;
}

interface NoteTag {
  tags: Tag;
}

interface Recording {
  id: string;
  title: string;
  duration: number | null;
  created_at: string;
  file_path: string;
  notes: Note[];
  notes_tags: NoteTag[];
}

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
            processed_content
          ),
          notes_tags (
            tags (
              name
            )
          )
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Recording[];
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

  const formatDuration = (duration: number | null) => {
    if (!duration) return "Unknown duration";
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  if (isLoading) {
    return <div className="p-8">Loading recordings...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8 space-y-4">
        <h1 className="text-3xl font-bold">My Recordings</h1>
        <Input
          type="text"
          placeholder="Search recordings..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="max-w-md"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredRecordings?.map((recording) => (
          <Card key={recording.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-xl">{recording.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-600 line-clamp-3">
                {recording.notes?.[0]?.processed_content || "No content available"}
              </p>
              <div className="flex flex-wrap gap-2">
                {recording.notes_tags?.map(({ tags }) => (
                  <span
                    key={tags?.name}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full"
                  >
                    {tags?.name}
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-4 text-sm text-gray-500">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {formatDuration(recording.duration)}
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  {formatDistanceToNow(new Date(recording.created_at), { addSuffix: true })}
                </span>
              </div>
            </CardContent>
            <CardFooter className="flex gap-2">
              <Button
                variant="default"
                size="sm"
                onClick={() => navigate(`/app/notes-record/${recording.id}`)}
              >
                <Play className="h-4 w-4" />
                Play
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/app/notes/${recording.id}/edit`)}
              >
                <Pencil className="h-4 w-4" />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(recording.id)}
              >
                <Trash2 className="h-4 w-4" />
                Delete
              </Button>
              <Button variant="outline" size="sm">
                <Share2 className="h-4 w-4" />
                Share
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default RecordingsPage;