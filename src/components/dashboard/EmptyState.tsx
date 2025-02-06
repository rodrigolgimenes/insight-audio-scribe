import { FileText } from "lucide-react";

export const EmptyState = () => {
  return (
    <div className="flex flex-col items-center justify-center h-[400px] bg-white rounded-lg border border-dashed border-gray-300">
      <div className="text-center">
        <FileText className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <h3 className="text-lg font-medium text-gray-900">No notes yet</h3>
        <p className="text-sm text-gray-500">
          Start by recording or uploading an audio file.
        </p>
      </div>
    </div>
  );
};