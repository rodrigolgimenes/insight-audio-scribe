
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

interface ProcessedContentAccordionProps {
  content: string;
}

export const ProcessedContentAccordion = ({ content }: ProcessedContentAccordionProps) => {
  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="processed-content" className="border rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors duration-200">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-700">Processed Content</h2>
            <ChevronDown className="h-5 w-5 text-gray-500 shrink-0 transition-transform duration-200" />
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-gray-50 p-6 rounded-b-lg">
            <p className="text-sm text-gray-500 mb-4 italic">
              This is the content processed by AI.
            </p>
            <div className="whitespace-pre-wrap text-gray-700 max-h-[500px] overflow-y-auto prose prose-sm">
              <div dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};
