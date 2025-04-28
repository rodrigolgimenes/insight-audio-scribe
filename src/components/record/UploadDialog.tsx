
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ 
  isOpen, 
  onOpenChange 
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="animate-spin mb-4 text-[#4338ca]" size={48} />
          <h3 className="text-xl font-medium mb-2">Processing Recording</h3>
          <p className="text-gray-500 text-center">
            Your recording is being uploaded to the cloud. Please wait...
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};
