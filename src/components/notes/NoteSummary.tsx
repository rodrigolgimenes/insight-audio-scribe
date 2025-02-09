
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const NoteSummary = () => {
  return (
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
    </Accordion>
  );
};
