
import { Mic, FileAudio, Phone } from "lucide-react";

interface RecordingModeIconProps {
  mode?: string;
}

export const RecordingModeIcon = ({ mode }: RecordingModeIconProps) => {
  // Determinamos o ícone com base no modo da gravação
  const getIcon = () => {
    switch (mode?.toLowerCase()) {
      case "file":
        return <FileAudio className="h-4 w-4 text-blue-500" />;
      case "phone":
        return <Phone className="h-4 w-4 text-purple-500" />;
      case "mic":
      default:
        return <Mic className="h-4 w-4 text-green-500" />;
    }
  };

  return (
    <div className="flex items-center gap-2">
      {getIcon()}
      <span>{mode || "Mic"}</span>
    </div>
  );
};
