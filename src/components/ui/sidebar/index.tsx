
import * as React from "react"
import { Button } from "@/components/ui/button"
import { PanelLeft } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sidebar } from "./sidebar-base"
import { SidebarProvider, useSidebar } from "./sidebar-context"
import {
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInput,
  SidebarSeparator,
  SidebarGroup,
  SidebarGroupContent,
} from "./sidebar-sections"
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
} from "./sidebar-menu"

const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggleSidebar } = useSidebar()

  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event)
        toggleSidebar()
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  )
})
SidebarTrigger.displayName = "SidebarTrigger"

export {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarInput,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSkeleton,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
  useSidebar,
}
