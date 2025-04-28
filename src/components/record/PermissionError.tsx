
import React from 'react';
import { AlertCircle } from "lucide-react";

interface PermissionErrorProps {
  error: string;
}

export const PermissionError: React.FC<PermissionErrorProps> = ({ error }) => {
  return (
    <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
      <AlertCircle className="h-5 w-5 text-red-500 mt-1 flex-shrink-0" />
      <div>
        <p className="text-red-800 font-medium">Permission Error</p>
        <p className="text-red-600 text-sm">{error}</p>
      </div>
    </div>
  );
};
