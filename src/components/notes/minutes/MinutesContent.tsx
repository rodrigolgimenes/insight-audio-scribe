
import { useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { MinutesEditor } from "@/components/notes/minutes/MinutesEditor";
import ReactMarkdown from 'react-markdown';

interface MinutesContentProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const MinutesContent = ({
  content,
  onChange,
  onSave,
  onCancel,
  readOnly = false
}: MinutesContentProps) => {
  // Se estiver em modo de edição, use o editor
  if (!readOnly && onChange) {
    return (
      <div className="space-y-4">
        <MinutesEditor 
          content={content}
          onChange={onChange}
          onSave={onSave}
          onCancel={onCancel}
          readOnly={readOnly}
        />
        
        <div className="flex justify-end gap-2 mt-4">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          {onSave && (
            <Button onClick={onSave}>
              Save Changes
            </Button>
          )}
        </div>
      </div>
    );
  }

  // Se for apenas leitura, renderize o markdown
  return (
    <div className="prose prose-blue max-w-none">
      <ReactMarkdown>
        {content}
      </ReactMarkdown>
    </div>
  );
};
