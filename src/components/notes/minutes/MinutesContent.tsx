
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

  // Se for apenas leitura, renderize o markdown com estilos aprimorados
  return (
    <div className="prose prose-blue max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          h1: ({ node, ...props }) => <h1 className="text-2xl font-bold mt-6 mb-4" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-xl font-bold mt-5 mb-3" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-lg font-bold mt-4 mb-2" {...props} />,
          ul: ({ node, ...props }) => <ul className="list-disc pl-6 mb-4" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-6 mb-4" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
          p: ({ node, ...props }) => <p className="mb-4" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
          em: ({ node, ...props }) => <em className="italic" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-6 border-t border-gray-300" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
