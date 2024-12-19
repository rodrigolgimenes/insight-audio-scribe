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

      {/* OpenAI Debug Info */}
      <div className="border-t pt-8">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">OpenAI Debug Info</h2>
        
        <div className="space-y-6">
          {/* Input sent to OpenAI */}
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Complete Prompt Sent to OpenAI:</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                {note.full_prompt || note.original_transcript}
              </pre>
            </div>
          </div>

          {/* Output received from OpenAI */}
          <div>
            <h3 className="text-lg font-medium text-gray-600 mb-2">Output Received from OpenAI:</h3>
            <div className="bg-gray-50 rounded-lg p-6">
              <pre className="whitespace-pre-wrap text-sm text-gray-600 font-mono">
                {note.processed_content}
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};