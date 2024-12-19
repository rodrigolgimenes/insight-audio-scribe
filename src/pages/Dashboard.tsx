import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Mic, FileText, Paintbrush, Headphones, Settings } from "lucide-react";
import { cn } from "@/lib/utils";

const Sidebar = () => {
  const menuItems = [
    { icon: Mic, label: "Recorder", href: "#" },
    { icon: FileText, label: "Notes", href: "#", active: true },
    { icon: Paintbrush, label: "Styles", href: "#" },
    { icon: Headphones, label: "Recordings", href: "#" },
    { icon: Settings, label: "Settings", href: "#" },
  ];

  return (
    <div className="w-[200px] h-screen bg-white border-r flex flex-col">
      <div className="p-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8">
            <img src="/lovable-uploads/02103839-f9d2-494b-bd64-c1489cc429d3.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="font-semibold">TalkNotes</span>
        </div>
        <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          Upgrade Now
        </Button>
      </div>
      <nav className="flex-1 px-2">
        {menuItems.map((item) => (
          <a
            key={item.label}
            href={item.href}
            className={cn(
              "flex items-center gap-2 px-3 py-2 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors",
              item.active && "bg-gray-100"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </a>
        ))}
      </nav>
      <div className="p-4 mt-auto">
        <div className="text-sm text-gray-500">
          <a href="#" className="block py-1 hover:text-gray-900">What's new</a>
          <a href="#" className="block py-1 hover:text-gray-900">Support</a>
          <a href="#" className="block py-1 hover:text-gray-900">Guide</a>
          <a href="#" className="block py-1 hover:text-gray-900">Suggest an idea</a>
          <a href="#" className="block py-1 hover:text-gray-900">Report a bug</a>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
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
            <Button className="bg-indigo-600 hover:bg-indigo-700">
              + New Note
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;