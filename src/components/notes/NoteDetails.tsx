import { useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Tag as TagIcon, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { TagsDialog } from "./TagsDialog";
import { useToast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const NoteDetails = () => {
  const { noteId } = useParams();
  const [isTagsDialogOpen, setIsTagsDialogOpen] = useState(false);
  const { toast } = useToast();

  // Fetch tags for the current note
  const { data: tags, refetch: refetchTags } = useQuery({
    queryKey: ["note-tags", noteId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*, notes_tags!inner(note_id)")
        .eq("notes_tags.note_id", noteId);

      if (error) throw error;
      return data;
    },
    enabled: !!noteId,
  });

  const handleRemoveTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .delete()
        .eq("note_id", noteId)
        .eq("tag_id", tagId);

      if (error) throw error;

      toast({
        title: "Tag removed",
        description: "Tag has been removed from the note.",
      });

      refetchTags();
    } catch (error: any) {
      toast({
        title: "Error removing tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddTag = async (tagId: string) => {
    try {
      const { error } = await supabase
        .from("notes_tags")
        .insert({
          note_id: noteId,
          tag_id: tagId,
        });

      if (error) throw error;

      toast({
        title: "Tag added",
        description: "Tag has been added to the note.",
      });

      refetchTags();
    } catch (error: any) {
      toast({
        title: "Error adding tag",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          className="mb-4"
          onClick={() => setIsTagsDialogOpen(true)}
        >
          <TagIcon className="w-4 h-4 mr-2" />
          Add Tag
        </Button>
        <div className="flex flex-wrap gap-2">
          {tags?.map((tag) => (
            <div
              key={tag.id}
              className="group flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-md text-sm"
            >
              <TagIcon
                className="w-3 h-3 mr-1"
                style={{ color: tag.color }}
              />
              {tag.name}
              <button
                onClick={() => handleRemoveTag(tag.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity ml-1"
              >
                <X className="w-3 h-3 text-gray-500 hover:text-red-500" />
              </button>
            </div>
          ))}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="summary">
          <AccordionTrigger>Summary</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <strong>Call Title:</strong> Portal Implementation Discussion
              </div>
              <div>
                <strong>Date:</strong> 20/12/2024
              </div>
              <div>
                <strong>Attendees:</strong> Rodrigo Gimenes, Unknown Speaker 1
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="background">
          <AccordionTrigger>Project Background</AccordionTrigger>
          <AccordionContent>
            <p className="text-gray-700">
              This project aims to implement a new portal system that will streamline our current processes and improve user experience.
            </p>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="challenges">
          <AccordionTrigger>Anticipated Challenges</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Justifying new tools and technologies</li>
              <li>Integrating with existing systems</li>
              <li>Training users on new functionalities</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="solutions">
          <AccordionTrigger>Potential Solutions</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Leverage existing portal frameworks</li>
              <li>Create comprehensive workflow documentation</li>
              <li>Implement phased rollout strategy</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="risks">
          <AccordionTrigger>Risks and Contingencies</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Data migration risks - Full backup strategy in place</li>
              <li>User adoption - Comprehensive training program planned</li>
              <li>System performance - Load testing scheduled</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="preventative">
          <AccordionTrigger>Preventative Actions</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Regular system backups</li>
              <li>User feedback collection</li>
              <li>Performance monitoring implementation</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="responsibilities">
          <AccordionTrigger>Assigning Responsibility</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Rodrigo: Send documentation by end of week</li>
              <li>Team Lead: Review implementation timeline</li>
              <li>Dev Team: Prepare technical specifications</li>
            </ul>
          </AccordionContent>
        </AccordionItem>

        <AccordionItem value="next-steps">
          <AccordionTrigger>Next Steps</AccordionTrigger>
          <AccordionContent>
            <ul className="list-disc pl-6 space-y-2">
              <li>Schedule follow-up meeting</li>
              <li>Distribute meeting minutes</li>
              <li>Begin resource allocation</li>
            </ul>
          </AccordionContent>
        </AccordionItem>
      </Accordion>

      <TagsDialog
        isOpen={isTagsDialogOpen}
        onOpenChange={setIsTagsDialogOpen}
        onAddTag={handleAddTag}
        selectedTags={tags?.map(tag => tag.id) || []}
      />
    </>
  );
};
