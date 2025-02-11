
import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { X, Upload, FileIcon, Loader2 } from "lucide-react";

interface BugReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface FileWithPreview extends File {
  preview?: string;
}

const MAX_TOTAL_SIZE = 30 * 1024 * 1024; // 30MB in bytes
const MAX_FILES = 10;

export function BugReportDialog({ open, onOpenChange }: BugReportDialogProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [files, setFiles] = useState<FileWithPreview[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const getTotalFileSize = (fileList: File[]) => {
    return fileList.reduce((total, file) => total + file.size, 0);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    if (files.length + selectedFiles.length > MAX_FILES) {
      toast({
        title: "Error",
        description: `You can only upload up to ${MAX_FILES} files.`,
        variant: "destructive",
      });
      return;
    }

    const totalSize = getTotalFileSize([...files, ...selectedFiles]);
    if (totalSize > MAX_TOTAL_SIZE) {
      toast({
        title: "Error",
        description: "Total file size exceeds 30MB limit.",
        variant: "destructive",
      });
      return;
    }

    const newFiles = selectedFiles.map(file => {
      if (file.type.startsWith('image/')) {
        const preview = URL.createObjectURL(file);
        return Object.assign(file, { preview });
      }
      return file;
    });

    setFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index: number) => {
    setFiles(prev => {
      const newFiles = [...prev];
      if (newFiles[index].preview) {
        URL.revokeObjectURL(newFiles[index].preview!);
      }
      newFiles.splice(index, 1);
      return newFiles;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error("User not authenticated");
      }

      // Get browser and platform info
      const browserInfo = {
        userAgent: navigator.userAgent,
        language: navigator.language,
      };

      const platformInfo = {
        platform: navigator.platform,
        screenSize: `${window.screen.width}x${window.screen.height}`,
      };

      // Create bug report
      const { data: bugReport, error: bugError } = await supabase
        .from("bug_reports")
        .insert({
          user_id: user.id,
          email: user.email,
          title,
          description,
          total_attachments: files.length,
          browser_info: browserInfo,
          platform_info: platformInfo
        })
        .select()
        .single();

      if (bugError) throw bugError;

      // Upload files
      for (const file of files) {
        const filePath = `${user.id}/${bugReport.id}/${file.name}`;
        
        const { error: uploadError } = await supabase.storage
          .from('bug_attachments')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // Create attachment record
        const { error: attachmentError } = await supabase
          .from("bug_report_attachments")
          .insert({
            bug_report_id: bugReport.id,
            file_path: filePath,
            file_name: file.name,
            file_type: file.type,
            file_size: file.size
          });

        if (attachmentError) throw attachmentError;
      }

      toast({
        title: "Success",
        description: "Bug report submitted successfully!",
      });

      // Reset form and close dialog
      setTitle("");
      setDescription("");
      setFiles([]);
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting bug report:", error);
      toast({
        title: "Error",
        description: "Failed to submit bug report. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Report a Bug</DialogTitle>
          <DialogDescription>
            Help us improve by reporting any issues you encounter.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief description of the issue"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please provide detailed steps to reproduce the issue"
              className="min-h-[100px]"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Attachments (Optional)</Label>
            <div className="border-2 border-dashed rounded-lg p-4">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                multiple
                accept="image/*,video/*"
              />
              <div className="flex flex-col items-center justify-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={files.length >= MAX_FILES}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Files
                </Button>
                <p className="text-sm text-gray-500">
                  Max {MAX_FILES} files, 30MB total. Images and videos only.
                </p>
              </div>
            </div>
            {files.length > 0 && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {files.map((file, index) => (
                  <div key={index} className="relative border rounded-lg p-2">
                    <button
                      type="button"
                      onClick={() => removeFile(index)}
                      className="absolute top-1 right-1 p-1 bg-white rounded-full shadow-sm hover:bg-gray-100"
                    >
                      <X className="w-4 h-4" />
                    </button>
                    {file.type.startsWith('image/') ? (
                      <img
                        src={file.preview}
                        alt={file.name}
                        className="w-full h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-24 flex items-center justify-center bg-gray-100 rounded">
                        <FileIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                    <p className="text-xs mt-2 truncate">{file.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#E91E63] hover:bg-[#D81B60] text-white"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Report'
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
