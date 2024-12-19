import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FileText } from "lucide-react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";

const Dashboard = () => {
  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="notes" />
        <main className="flex-1 p-8">
          <h1 className="text-2xl font-bold mb-6">My notes:</h1>
          <div className="mb-6">
            <Input
              type="search"
              placeholder="Search notes..."
              className="max-w-md"
            />
          </div>
          <div className="flex items-center gap-2 mb-8">
            <span className="text-sm text-gray-600">Select notes</span>
            <Switch />
          </div>
          <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
            <div className="text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-medium text-gray-900">No notes</h3>
              <p className="text-sm text-gray-500 mb-4">
                Get started by creating a new note.
              </p>
              <Button className="bg-[#E91E63] hover:bg-[#D81B60]">
                + New Note
              </Button>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;