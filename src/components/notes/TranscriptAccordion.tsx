import { ChevronDown } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface TranscriptAccordionProps {
  transcript: string | null;
}

export const TranscriptAccordion = ({ transcript }: TranscriptAccordionProps) => {
  if (!transcript) return null;

  return (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="transcript" className="border-t">
        <AccordionTrigger className="py-6">
          <h2 className="text-xl font-semibold text-gray-700">Transcrição Original</h2>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-4">
              Esta é a transcrição automatizada. Pode conter erros.
            </p>
            <div className="whitespace-pre-wrap text-gray-700">
              {transcript}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};