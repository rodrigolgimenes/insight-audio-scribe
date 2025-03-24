
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { FileAudio, Upload } from "lucide-react";
import { toast } from "sonner";

interface UploadFileActionProps {
  onSuccess: () => Promise<{ success: boolean }>;
}

export function UploadFileAction({ onSuccess }: UploadFileActionProps) {
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Simple simulation for now
      await new Promise(resolve => setTimeout(resolve, 1000));
      await onSuccess();
      toast.success("File uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload file");
      console.error(error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
        <FileAudio className="h-10 w-10 text-gray-400 mb-3" />
        <p className="text-sm text-gray-600 mb-2">Drag & drop an audio file or click to browse</p>
        <Button 
          variant="outline"
          className="relative"
          disabled={isUploading}
        >
          <input
            type="file"
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            accept="audio/*,video/mp4,video/webm,video/quicktime"
            onChange={handleUpload}
            disabled={isUploading}
          />
          <Upload className="h-4 w-4 mr-2" />
          {isUploading ? "Uploading..." : "Choose File"}
        </Button>
      </div>
      <p className="text-xs text-gray-500 text-center">
        Supported formats: MP3, WAV, M4A, MP4 (audio), WebM
      </p>
    </div>
  );
}
