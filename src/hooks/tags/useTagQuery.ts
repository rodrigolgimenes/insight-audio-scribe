
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useTagQuery = (tagId: string | undefined) => {
  return useQuery({
    queryKey: ["tag", tagId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .eq("id", tagId)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!tagId,
    staleTime: 1000 * 60 * 5,
    cacheTime: 1000 * 60 * 30,
  });
};
