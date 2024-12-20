import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileDown } from "lucide-react";
import { TagList } from "@/components/tags/TagList";
import { AudioPlayer } from "@/components/notes/AudioPlayer";
import { NoteDetails } from "@/components/notes/NoteDetails";

const NotesRecord = () => {
  const [title, setTitle] = useState("Portal Implementation Discussion");
  const [summary, setSummary] = useState(
    "This meeting covered the implementation strategy for the new portal, discussing key challenges and solutions."
  );

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 overflow-auto">
          <div className="container mx-auto py-8 px-4">
            {/* Header Section */}
            <div className="mb-8">
              <div
                contentEditable
                suppressContentEditableWarning
                className="text-4xl font-bold mb-4 outline-none border-b-2 border-transparent hover:border-blue-500 transition-colors"
                onBlur={(e) => setTitle(e.currentTarget.textContent || "")}
              >
                {title}
              </div>
              <div
                contentEditable
                suppressContentEditableWarning
                className="text-lg text-gray-600 mb-4 outline-none border-b-2 border-transparent hover:border-blue-500 transition-colors"
                onBlur={(e) => setSummary(e.currentTarget.textContent || "")}
              >
                {summary}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Sidebar - Tags and Audio */}
              <Card className="p-6 lg:col-span-1">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Tags</h3>
                    <TagList />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold mb-4">Recording</h3>
                    <AudioPlayer />
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-sm text-gray-500">Duration: 45:30</span>
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        Download Audio
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>

              {/* Main Content */}
              <Card className="p-6 lg:col-span-2">
                <ScrollArea className="h-[calc(100vh-12rem)]">
                  <NoteDetails />
                </ScrollArea>
                <div className="flex justify-end mt-4 gap-2">
                  <Button variant="outline">
                    <FileDown className="h-4 w-4 mr-2" />
                    Export PDF
                  </Button>
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default NotesRecord;