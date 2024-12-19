import { useQuery } from "@tanstack/react-query";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { StylesList } from "@/components/styles/StylesList";
import { StylesHeader } from "@/components/styles/StylesHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const StylesPage = () => {
  const { toast } = useToast();

  const { data: styles, isLoading } = useQuery({
    queryKey: ["styles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("styles")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast({
          title: "Error loading styles",
          description: error.message,
          variant: "destructive",
        });
        throw error;
      }

      return data;
    },
  });

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="styles" />
        <main className="flex-1 overflow-auto">
          <StylesHeader />
          <div className="container mx-auto px-4 py-8">
            {isLoading ? (
              <div>Loading styles...</div>
            ) : (
              <StylesList styles={styles || []} />
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default StylesPage;