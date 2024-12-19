import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Style } from "@/types/styles";

interface StyleSelectorProps {
  styles: Style[];
  selectedStyleId: string | null;
  onStyleSelect: (styleId: string) => void;
  isProcessing: boolean;
}

export const StyleSelector = ({
  styles,
  selectedStyleId,
  onStyleSelect,
  isProcessing,
}: StyleSelectorProps) => {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Choose a Style</h2>
      <Select
        value={selectedStyleId || undefined}
        onValueChange={onStyleSelect}
        disabled={isProcessing}
      >
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a style..." />
        </SelectTrigger>
        <SelectContent>
          {styles.map((style) => (
            <SelectItem key={style.id} value={style.id}>
              {style.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selectedStyleId && (
        <p className="text-sm text-gray-500">
          {styles.find(s => s.id === selectedStyleId)?.description}
        </p>
      )}
    </div>
  );
};