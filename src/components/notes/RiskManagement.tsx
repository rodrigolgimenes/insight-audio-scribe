
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export const RiskManagement = () => {
  return (
    <Accordion type="single" collapsible className="w-full">
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
    </Accordion>
  );
};
