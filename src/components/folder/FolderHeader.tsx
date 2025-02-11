
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface FolderHeaderProps {
  folderName: string;
}

export const FolderHeader = ({ folderName }: FolderHeaderProps) => {
  return (
    <>
      <h1 className="text-2xl font-bold mb-6">{folderName}</h1>
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="search"
            placeholder="Search notes..."
            className="pl-10"
          />
        </div>
      </div>
    </>
  );
};
