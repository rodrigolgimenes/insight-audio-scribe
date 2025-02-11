
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";
import { useFileUpload } from "@/hooks/useFileUpload";

interface FileUploadSectionProps {
  isDisabled?: boolean;
}

export const FileUploadSection = ({ isDisabled }: FileUploadSectionProps) => {
  const { isUploading, handleFileUpload } = useFileUpload();

  return (
    <div className="relative">
      <Input
        type="file"
        accept="audio/*,video/mp4"
        className="hidden"
        id="file-upload"
        name="file-upload"
        onChange={handleFileUpload}
        disabled={isUploading || isDisabled}
      />
      <Button 
        className="bg-[#2196F3] hover:bg-[#1976D2] gap-2"
        onClick={() => document.getElementById('file-upload')?.click()}
        disabled={isUploading || isDisabled}
      >
        <Upload className="w-4 h-4" />
        {isUploading ? 'Enviando...' : 'Upload'}
      </Button>
    </div>
  );
};
