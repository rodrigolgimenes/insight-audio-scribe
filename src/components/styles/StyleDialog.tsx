import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/auth/AuthProvider";

interface Style {
  id: string;
  name: string;
  description: string;
  prompt_template: string;
  category: string;
}

interface StyleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  style: Style | null;
}

export function StyleDialog({ open, onOpenChange, style }: StyleDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { session } = useAuth();
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: style || {
      name: "",
      description: "",
      prompt_template: "",
      category: "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: Partial<Style>) => {
      if (!session?.user?.id) throw new Error("User not authenticated");
      
      if (style?.id) {
        const { error } = await supabase
          .from("styles")
          .update({ ...data, user_id: session.user.id })
          .eq("id", style.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("styles")
          .insert([{ ...data, user_id: session.user.id }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["styles"] });
      toast({
        title: `Style ${style ? "updated" : "created"} successfully`,
        description: `The style has been ${style ? "updated" : "created"}.`,
      });
      onOpenChange(false);
      reset();
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    mutation.mutate(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{style ? "Edit Style" : "Create Style"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Input
              id="category"
              {...register("category")}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="prompt_template">Prompt Template</Label>
            <Textarea
              id="prompt_template"
              {...register("prompt_template", {
                required: "Prompt template is required",
                validate: value => 
                  value.includes("{{transcript}}") || 
                  "Template must include {{transcript}} placeholder"
              })}
              rows={4}
            />
            {errors.prompt_template && (
              <p className="text-sm text-red-500">{errors.prompt_template.message}</p>
            )}
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#E91E63] hover:bg-[#D81B60]"
              disabled={mutation.isPending}
            >
              {mutation.isPending ? "Saving..." : (style ? "Update" : "Create")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}