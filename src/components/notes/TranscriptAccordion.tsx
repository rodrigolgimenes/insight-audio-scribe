import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ChevronDown } from "lucide-react";

interface TranscriptAccordionProps {
  transcript: string | null;
}

export const TranscriptAccordion = ({ transcript }: TranscriptAccordionProps) => {
  if (!transcript) return null;

  return (
    <Accordion type="single" collapsible className="w-full mt-8">
      <AccordionItem value="transcript" className="border rounded-lg shadow-sm">
        <AccordionTrigger className="px-4 py-3 hover:bg-gray-50 transition-colors">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-700">Transcrição Original</h2>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="bg-gray-50 p-6 rounded-lg">
            <p className="text-sm text-gray-500 mb-4">
              Esta é a transcrição automatizada. Pode conter erros.
            </p>
            <div className="whitespace-pre-wrap text-gray-700 max-h-[500px] overflow-y-auto">
              {transcript}
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};