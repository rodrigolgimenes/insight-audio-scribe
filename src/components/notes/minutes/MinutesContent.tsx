
import { MinutesEditor } from './MinutesEditor';

interface MinutesContentProps {
  content: string;
  onChange?: (content: string) => void;
  readOnly?: boolean;
}

export const MinutesContent = ({ content, onChange, readOnly = false }: MinutesContentProps) => {
  return <MinutesEditor content={content} onChange={onChange} readOnly={readOnly} />;
};
