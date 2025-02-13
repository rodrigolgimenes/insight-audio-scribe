
import { MinutesEditor } from './MinutesEditor';
import ReactMarkdown from 'react-markdown';

interface MinutesContentProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const MinutesContent = ({ content, onChange, onSave, onCancel, readOnly = false }: MinutesContentProps) => {
  if (readOnly) {
    return (
      <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none p-4 border rounded-lg bg-white">
        <ReactMarkdown>{content}</ReactMarkdown>
      </div>
    );
  }

  return (
    <MinutesEditor 
      content={content} 
      onChange={onChange} 
      onSave={onSave}
      onCancel={onCancel}
      readOnly={readOnly} 
    />
  );
};
