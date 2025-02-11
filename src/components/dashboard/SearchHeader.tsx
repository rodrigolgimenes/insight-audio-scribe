
import { Switch } from "@/components/ui/switch";

interface SearchHeaderProps {
  isSelectionMode: boolean;
  setIsSelectionMode: (value: boolean) => void;
}

export const SearchHeader = ({
  isSelectionMode,
  setIsSelectionMode,
}: SearchHeaderProps) => {
  return (
    <div className="mb-8">
      <h1 className="text-3xl font-bold mb-4">My Recordings</h1>
      <div className="flex items-center gap-2">
        <Switch
          checked={isSelectionMode}
          onCheckedChange={setIsSelectionMode}
        />
        <span className="text-sm text-gray-600">
          {isSelectionMode ? "Exit selection mode" : "Select multiple notes"}
        </span>
      </div>
    </div>
  );
};
