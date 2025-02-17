
import { Input } from "@/components/ui/input";

export interface UncategorizedHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const UncategorizedHeader = ({
  searchQuery,
  setSearchQuery,
}: UncategorizedHeaderProps) => {
  return (
    <div className="mb-8 space-y-4">
      <h1 className="text-3xl font-bold">Uncategorized Files</h1>
      <Input
        type="text"
        placeholder="Search files..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />
    </div>
  );
};
