
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Mic, FileText, Settings } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { FolderList } from "./folders/FolderList";
import { TagList } from "./tags/TagList";
import { useState } from "react";
import { SuggestionDialog } from "./suggestions/SuggestionDialog";
import { BugReportDialog } from "./bugs/BugReportDialog";

interface AppSidebarProps {
  activePage?: string;
}

export function AppSidebar({ activePage }: AppSidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSuggestionDialogOpen, setIsSuggestionDialogOpen] = useState(false);
  const [isBugReportDialogOpen, setIsBugReportDialogOpen] = useState(false);
  
  const menuItems = [
    { icon: Mic, label: "Record", href: "/simple-record", id: "simple-record" },
    { icon: FileText, label: "Notes", href: "/app", id: "notes" },
    { icon: Settings, label: "Settings", href: "/settings", id: "settings" },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-xl font-semibold text-palatinate-blue">InsightScribe</span>
          </div>
          <Button className="w-full bg-palatinate-blue hover:bg-primary-dark text-white">
            Upgrade Now
          </Button>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const isActive = 
                  (activePage === item.id) || 
                  (location.pathname === item.href) ||
                  (item.href === '/simple-record' && location.pathname === '/simple-record');
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      asChild
                      data-active={isActive}
                      onClick={() => navigate(item.href)}
                    >
                      <button>
                        <item.icon className={isActive ? "text-palatinate-blue" : ""} />
                        <span className={isActive ? "text-palatinate-blue" : ""}>{item.label}</span>
                      </button>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
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
            <button 
              onClick={() => setIsSuggestionDialogOpen(true)}
              className="block w-full text-left py-1 hover:text-gray-900"
            >
              Suggest an idea
            </button>
            <button 
              onClick={() => setIsBugReportDialogOpen(true)}
              className="block w-full text-left py-1 hover:text-gray-900"
            >
              Report a bug
            </button>
          </div>
        </div>
      </SidebarFooter>

      <SuggestionDialog 
        open={isSuggestionDialogOpen}
        onOpenChange={setIsSuggestionDialogOpen}
      />
      <BugReportDialog
        open={isBugReportDialogOpen}
        onOpenChange={setIsBugReportDialogOpen}
      />
    </Sidebar>
  );
}
