
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Check, X } from 'lucide-react';

interface EditablePricingTextProps {
  initialText: string;
  className?: string;
  onSave?: (newText: string) => void;
}

export const EditablePricingText: React.FC<EditablePricingTextProps> = ({
  initialText,
  className = "",
  onSave
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(initialText);

  const handleSubmit = () => {
    if (onSave) {
      onSave(text);
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setText(initialText);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          className={`${className} h-auto py-1 px-2`}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
            if (e.key === "Escape") handleCancel();
          }}
          autoFocus
        />
        <Button
          size="icon"
          variant="ghost"
          onClick={handleSubmit}
          className="h-9 w-9"
        >
          <Check className="h-4 w-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          onClick={handleCancel}
          className="h-9 w-9"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className={className}>{text}</span>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsEditing(true)}
        className="h-9 w-9"
      >
        <Pencil className="h-4 w-4" />
      </Button>
    </div>
  );
};
