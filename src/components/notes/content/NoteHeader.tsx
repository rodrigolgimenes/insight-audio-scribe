
import React from "react";

interface NoteHeaderProps {
  title: string;
  createdAt: string;
}

export const NoteHeader: React.FC<NoteHeaderProps> = ({ title, createdAt }) => {
  return (
    <div className="pb-4 border-b border-gray-200">
      <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
      <p className="text-gray-500 mt-1">
        {new Date(createdAt).toLocaleDateString('en-US', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        })}
      </p>
    </div>
  );
};
