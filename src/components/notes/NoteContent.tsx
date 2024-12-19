interface NoteContentProps {
  title: string;
  processed_content: string;
}

export const NoteContent = ({ title, processed_content }: NoteContentProps) => {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{title}</h1>
      <div className="bg-white rounded-lg p-6 shadow-sm">
        <p className="whitespace-pre-wrap">{processed_content}</p>
      </div>
    </div>
  );
};