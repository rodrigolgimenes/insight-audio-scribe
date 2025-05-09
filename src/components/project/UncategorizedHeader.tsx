
import { Switch } from "@/components/ui/switch";

interface UncategorizedHeaderProps {
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
}

export const UncategorizedHeader = ({
  isSelectionMode,
  setIsSelectionMode,
}: UncategorizedHeaderProps) => {
  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-2xl font-bold">Uncategorized Notes</h1>
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">Select notes</span>
        <Switch
          checked={isSelectionMode}
          onCheckedChange={setIsSelectionMode}
        />
      </div>
    </div>
  );
};
