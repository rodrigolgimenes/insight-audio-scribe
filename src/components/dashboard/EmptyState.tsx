import { FileText } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-xl border border-dashed border-gray-300">
      <div className="text-center max-w-sm mx-auto px-4">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No notes yet
        </h3>
        <p className="text-sm text-gray-500">
          Start by recording or uploading an audio file to create your first note.
        </p>
      </div>
    </div>
  );
};