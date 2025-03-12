
import { Languages } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface LanguageSelectorProps {
  language: string;
  setLanguage: (language: string) => void;
  disabled: boolean;
}

export function LanguageSelector({ language, setLanguage, disabled }: LanguageSelectorProps) {
  return (
    <div className="flex items-center justify-between space-x-2">
      <div className="flex items-center space-x-2">
        <Label htmlFor="language" className="text-sm text-gray-700">
          Audio Language
        </Label>
        <Languages className="h-4 w-4 text-gray-500" />
      </div>
      <Select
        value={language}
        onValueChange={setLanguage}
        disabled={disabled}
      >
        <SelectTrigger className="w-[280px]">
          <SelectValue placeholder="Select language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="pt">Portuguese</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
          <SelectItem value="fr">French</SelectItem>
          <SelectItem value="de">German</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
