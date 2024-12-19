import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Paintbrush, Headphones, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { FolderList } from "./folders/FolderList";
import { TagList } from "./tags/TagList";

interface AppSidebarProps {
  activePage?: string;
}

export function AppSidebar({ activePage }: AppSidebarProps) {
  const navigate = useNavigate();
  
  const menuItems = [
    { icon: Mic, label: "Recorder", href: "/record", id: "recorder" },
    { icon: FileText, label: "Notes", href: "/app", id: "notes" },
    { icon: Paintbrush, label: "Styles", href: "#", id: "styles" },
    { icon: Headphones, label: "Recordings", href: "#", id: "recordings" },
    { icon: Settings, label: "Settings", href: "#", id: "settings" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8">
              <img src="/lovable-uploads/02103839-f9d2-494b-bd64-c1489cc429d3.png" alt="Logo" className="w-full h-full object-contain" />
            </div>
            <span className="font-semibold">TalkNotes</span>
          </div>
          <Button className="w-full bg-[#E91E63] hover:bg-[#D81B60] text-white">
            Upgrade Now
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    asChild
                    data-active={activePage === item.id}
                    onClick={() => navigate(item.href)}
                  >
                    <button>
                      <item.icon className={activePage === item.id ? "text-[#E91E63]" : ""} />
                      <span className={activePage === item.id ? "text-[#E91E63]" : ""}>{item.label}</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <FolderList />
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupContent>
            <TagList />
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="p-4 mt-auto">
          <div className="text-sm text-gray-500">
            <a href="#" className="block py-1 hover:text-gray-900">What's new</a>
            <a href="#" className="block py-1 hover:text-gray-900">Support</a>
            <a href="#" className="block py-1 hover:text-gray-900">Guide</a>
            <a href="#" className="block py-1 hover:text-gray-900">Suggest an idea</a>
            <a href="#" className="block py-1 hover:text-gray-900">Report a bug</a>
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}