
import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Mic, Loader2 } from "lucide-react";
import { ModalRecordContent } from "@/components/record/ModalRecordContent";
import { useNotes } from "@/hooks/useNotes";
import { AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { RecentRecordings } from "@/components/dashboard/RecentRecordings";
import { Toggle } from "@/components/ui/toggle";
import { CircleWavyCheck, FileAudio } from "phosphor-react";
import { UploadFileAction } from "./UploadFileAction";
import { useFileUpload } from "@/hooks";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface RecordingSheetProps {
  onClose?: () => void;
  onSuccess?: () => void;
  buttonText?: string;
  buttonVariant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  buttonSize?: "default" | "sm" | "lg" | "icon";
  buttonClassName?: string;
  triggerClassName?: string;
  showRecentItems?: boolean;
  isFloatingButton?: boolean;
  defaultTab?: "record" | "upload";
}

export function RecordingSheet({
  onClose,
  onSuccess,
  buttonText = "Record Audio",
  buttonVariant = "default",
  buttonSize = "default",
  buttonClassName = "",
  triggerClassName = "",
  showRecentItems = false,
  isFloatingButton = false,
  defaultTab = "record",
}: RecordingSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTab, setInitialTab] = useState<"record" | "upload">(defaultTab);
  const { isUploading, uploadProgress } = useFileUpload();
  const { 
    isLoading: isLoadingNotes, 
    notes, 
    refetch: refetchNotes 
  } = useNotes({ 
    limit: 5, 
    enabled: true, 
    refetchOnMount: true 
  });

  // Create a typed function for handleClose
  const handleClose = useCallback((): void => {
    setIsOpen(false);
    
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  // Create a typed function for handleSuccess
  const handleSuccess = useCallback((): Promise<{ success: boolean }> => {
    if (onSuccess) {
      onSuccess();
    }
    
    handleClose();
    toast.success("Recording saved successfully!");
    return Promise.resolve({ success: true });
  }, [onSuccess, handleClose]);

  useEffect(() => {
    if (isOpen && showRecentItems) {
      refetchNotes();
    }
  }, [isOpen, refetchNotes, showRecentItems]);

  const handleChangeTab = (tab: string) => {
    setInitialTab(tab as "record" | "upload");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild className={triggerClassName}>
        {isFloatingButton ? (
          <Button
            className={`rounded-full drop-shadow-md flex gap-2 fixed bottom-5 right-5 z-40 ${buttonClassName}`}
            size={buttonSize}
            variant={buttonVariant}
          >
            <Mic className="h-5 w-5" />
            {buttonText}
          </Button>
        ) : (
          <Button
            className={`rounded-md flex gap-2 ${buttonClassName}`}
            size={buttonSize}
            variant={buttonVariant}
          >
            <Mic className="h-5 w-5" />
            {buttonText}
          </Button>
        )}
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle>Add New Recording</SheetTitle>
          <SheetDescription>
            Record audio directly or upload an existing file.
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue={initialTab} onValueChange={handleChangeTab}>
          <TabsList className="w-full mb-6">
            <TabsTrigger value="record" className="flex-1 flex items-center justify-center gap-2">
              <Mic className="h-4 w-4" />
              Record
            </TabsTrigger>
            <TabsTrigger value="upload" className="flex-1 flex items-center justify-center gap-2">
              <FileAudio className="h-4 w-4" weight="fill" />
              Upload
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="record" className="mt-0">
            <ModalRecordContent
              closeModal={handleClose}
              onSuccess={onSuccess}
            />
          </TabsContent>
          
          <TabsContent value="upload" className="mt-0">
            <UploadFileAction onSuccess={handleSuccess} />
          </TabsContent>
        </Tabs>

        {showRecentItems && (
          <div className="mt-8">
            <h3 className="text-base font-medium mb-3 flex items-center gap-2">
              <CircleWavyCheck weight="fill" className="text-green-500" />
              Recent Recordings
            </h3>
            
            <RecentRecordings 
              notes={notes || []} 
              isLoading={isLoadingNotes} 
              onClick={handleClose}
            />
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
