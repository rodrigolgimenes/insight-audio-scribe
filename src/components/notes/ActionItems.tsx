
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ActionItems = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
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
  );
};
