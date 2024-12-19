import { Note } from "@/integrations/supabase/types/notes";

interface NoteContentProps {
  note: Note;
}

export const NoteContent = ({ note }: NoteContentProps) => {
  return (
    <div className="space-y-8">
      {/* Main content section */}
      <div className="prose max-w-none">
        <h1 className="text-3xl font-bold mb-6">{note.title}</h1>
        <div className="mb-8" dangerouslySetInnerHTML={{ __html: note.processed_content }} />
      </div>

      {/* Original transcript section */}
      {note.original_transcript && (
        <div className="border-t pt-8">
          <h2 className="text-xl font-semibold text-gray-700 mb-4">Original Transcript</h2>
          <div className="bg-gray-50 rounded-lg p-6">
            <p className="text-sm text-gray-500 mb-4">
              This is the automated transcription. It may contain errors.
            </p>
            <div className="whitespace-pre-wrap text-gray-700">
              {note.original_transcript}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};