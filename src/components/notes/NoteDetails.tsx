import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const NoteDetails = () => {
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
  );
};