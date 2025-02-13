
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

interface RegenerateButtonProps {
  onRegenerate: () => void;
  isGenerating: boolean;
  disabled: boolean;
}

export const RegenerateButton = ({ onRegenerate, isGenerating, disabled }: RegenerateButtonProps) => {
  return (
    <Button
      onClick={onRegenerate}
      disabled={isGenerating || disabled}
      className="gap-2"
      variant="outline"
    >
      {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
      Regenerate Meeting Minutes
    </Button>
  );
};
