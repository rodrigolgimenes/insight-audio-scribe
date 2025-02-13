
import { MinutesEditor } from './MinutesEditor';

interface MinutesContentProps {
  content: string;
  onChange?: (content: string) => void;
  onSave?: () => void;
  onCancel?: () => void;
  readOnly?: boolean;
}

export const MinutesContent = ({ content, onChange, onSave, onCancel, readOnly = false }: MinutesContentProps) => {
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
