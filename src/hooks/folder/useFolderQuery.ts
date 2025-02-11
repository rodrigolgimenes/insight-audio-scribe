
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useFolderQuery = (folderId: string | undefined) => {
  return useQuery({
    queryKey: ["folder", folderId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("folders")
        .select("*")
        .eq("id", folderId)
        .single();

      if (error) throw error;
      return data;
    },
  });
};
