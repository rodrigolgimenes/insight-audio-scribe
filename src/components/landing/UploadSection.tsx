
import { FileUpload } from "@/components/shared/FileUpload";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";

export const UploadSection = () => {
  const navigate = useNavigate();
  
  const handleUploadComplete = (noteId: string) => {
    navigate('/app');
  };
  
  return (
    <section className="container mx-auto px-4 py-12">
      <Card className="max-w-3xl mx-auto">
        <CardContent className="p-8">
          <h2 className="text-2xl font-semibold mb-4">Try It Now</h2>
          <p className="mb-6 text-gray-600">
            Upload an audio or video file to instantly transcribe and analyze it.
          </p>
          
          <FileUpload 
            onUploadComplete={handleUploadComplete}
            label="Upload your audio or video"
            description="Supported formats: MP3, WAV, WebM, MP4, MOV and more (max 100MB)"
            buttonText="Upload and Transcribe"
            initiateTranscription={true}
            accept="audio/*,video/mp4,video/webm,video/quicktime,video/avi,video/mpeg,video/x-matroska"
            buttonClassName="w-full"
          />
        </CardContent>
      </Card>
    </section>
  );
}
