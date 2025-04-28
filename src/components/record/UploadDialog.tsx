
import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Loader } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

interface UploadDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  progress?: number;
}

export const UploadDialog: React.FC<UploadDialogProps> = ({ 
  isOpen, 
  onOpenChange,
  progress = 0
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="flex flex-col items-center justify-center py-8">
          <Loader className="animate-spin mb-4 text-[#4285F4]" size={48} />
          <h3 className="text-xl font-medium mb-2">Processando Gravação</h3>
          <p className="text-gray-500 text-center mb-4">
            Sua gravação está sendo enviada para a nuvem. Por favor aguarde...
          </p>
          {progress > 0 && (
            <div className="w-full space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-sm text-gray-500 text-center">{Math.round(progress)}% completo</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
