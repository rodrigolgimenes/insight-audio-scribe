
import React from "react";
import { Loader2 } from "lucide-react";

interface Note {
  id: string;
  title: string;
  content?: string;
  user_id: string;
  recording_id?: string;
  created_at: string;
  updated_at: string;
  status: string;
  processing_progress?: number;
  duration?: number;
}

interface RecentRecordingsProps {
  notes: Note[];
  isLoading: boolean;
  onClick?: () => void;
}

export function RecentRecordings({ 
  notes, 
  isLoading,
  onClick
}: RecentRecordingsProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center p-4">
        No recent recordings found
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notes.map((note) => (
        <div 
          key={note.id} 
          className="p-3 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer"
          onClick={onClick}
        >
          <h4 className="font-medium text-sm">{note.title}</h4>
          <p className="text-xs text-gray-500">
            {new Date(note.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
}
