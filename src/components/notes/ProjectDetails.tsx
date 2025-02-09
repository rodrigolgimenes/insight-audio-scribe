
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const ProjectDetails = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
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
    </Accordion>
  );
};
