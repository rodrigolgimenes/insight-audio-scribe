import {
  LayoutDashboard,
  FileText,
  Folder,
  Settings,
  Plus,
  Search,
  Home,
  Book,
  User,
  HelpCircle,
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUser } from "@clerk/clerk-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from '@/lib/utils';

interface AppSidebarProps {
  activePage?: "dashboard" | "notes" | "projects" | "settings" | "recorder" | "test" | string;
}

export function AppSidebar({ activePage = "dashboard" }: AppSidebarProps) {
  const { user } = useUser();

  const sidebarMenuItems = [
    {
      title: "Dashboard",
      url: "/app",
      icon: LayoutDashboard,
    },
    {
      title: "Notes",
      url: "/app/notes",
      icon: FileText,
    },
    {
      title: "Projects",
      url: "/app/projects",
      icon: Folder,
    },
    {
      title: "Settings",
      url: "/app/settings",
      icon: Settings,
    },
    {
      title: "Help",
      url: "/app/help",
      icon: HelpCircle,
    },
    {
      title: "Uncategorized",
      url: "/app/uncategorized",
      icon: Folder,
    }
  ];

  return (
    <aside className="w-64 border-r flex flex-col h-screen bg-gray-50">
      <div className="flex items-center justify-between p-4">
        <NavLink to="/app" className="font-bold text-xl">
          My App
        </NavLink>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl} alt={user?.fullName || "Avatar"} />
                <AvatarFallback>{user?.firstName?.[0]}{user?.lastName?.[0]}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <User className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Book className="mr-2 h-4 w-4" />
              <span>My Courses</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuItem>
              <HelpCircle className="mr-2 h-4 w-4" />
              <span>Help & Feedback</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ScrollArea className="flex-1 px-4 py-2">
        <div className="space-y-1">
          {sidebarMenuItems.map((item) => (
            <NavLink
              key={item.title}
              to={item.url}
              className={({ isActive }) =>
                `flex items-center px-3 py-2 text-sm font-medium rounded-md hover:bg-gray-200 transition-colors ${
                  isActive
                    ? "bg-gray-200 text-gray-900"
                    : "text-gray-700"
                }`
              }
            >
              <item.icon className="mr-2 h-4 w-4" />
              <span>{item.title}</span>
            </NavLink>
          ))}
        </div>
      </ScrollArea>

      <div className="p-4">
        <Button variant="secondary" className="w-full justify-start gap-2">
          <Plus className="h-4 w-4" />
          New Project
        </Button>
      </div>
    </aside>
  );
}
