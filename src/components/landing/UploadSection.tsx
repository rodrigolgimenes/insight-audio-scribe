
import { FileUpload } from "@/components/shared/FileUpload";
import { useNavigate } from "react-router-dom";

export const UploadSection = () => {
  const navigate = useNavigate();
  
  const handleUploadComplete = (noteId: string) => {
    // Always navigate to the dashboard instead of individual note
    navigate('/app');
  };
  
  return (
    <section className="container mx-auto px-4 py-12">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-sm p-8 border">
        <h2 className="text-2xl font-semibold mb-4">Try It Now</h2>
        <p className="mb-6 text-gray-600">
          Upload an audio or video file to instantly transcribe and analyze it.
        </p>
        
        <FileUpload 
          onUploadComplete={handleUploadComplete}
          label="Upload your audio or video"
          description="Supported formats: MP3, WAV, WebM, MP4 (max 100MB)"
          buttonText="Upload and Transcribe"
          initiateTranscription={true}
        />
      </div>
    </section>
  );
};
