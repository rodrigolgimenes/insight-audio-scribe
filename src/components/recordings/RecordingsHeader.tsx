import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

interface RecordingsHeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export const RecordingsHeader = ({
  searchQuery,
  setSearchQuery,
}: RecordingsHeaderProps) => {
  return (
    <div className="mb-8 space-y-4">
      <h1 className="text-3xl font-bold">My Recordings</h1>
      <Input
        type="text"
        placeholder="Search recordings..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="max-w-md"
      />
    </div>
  );
};