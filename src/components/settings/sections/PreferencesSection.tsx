
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Globe } from 'lucide-react';
import { UserPreferences } from '../types';

interface PreferencesSectionProps {
  preferences: UserPreferences;
  onPreferencesChange: (newPreferences: Partial<UserPreferences>) => void;
  languageOptions: Array<{ value: string; label: string; }>;
  styleOptions: Array<{ value: string; label: string; }>;
}

export const PreferencesSection = ({
  preferences,
  onPreferencesChange,
  languageOptions,
  styleOptions,
}: PreferencesSectionProps) => {
  const { toast } = useToast();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Globe className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Preferences</h2>
      </div>
      <Separator />
      <div className="space-y-4">
        <div>
          <Label htmlFor="microphoneSelect">Microphone Selection</Label>
          <Select
            value={preferences?.default_microphone || ''}
            onValueChange={(value) => onPreferencesChange({ default_microphone: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select microphone" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Default Microphone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="languageSelect">Language Selection</Label>
          <Select
            value={preferences?.preferred_language || 'auto'}
            onValueChange={(value) => onPreferencesChange({ preferred_language: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languageOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="styleSelect">Default Style</Label>
          <Select
            value={preferences?.default_style || 'note'}
            onValueChange={(value) => onPreferencesChange({ default_style: value })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select style" />
            </SelectTrigger>
            <SelectContent>
              {styleOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="customWords">Custom Words</Label>
          <Input
            id="customWords"
            value={preferences?.custom_words || ''}
            onChange={(e) => {
              if (e.target.value.length <= 240) {
                onPreferencesChange({ custom_words: e.target.value });
              }
            }}
            placeholder="Enter custom words separated by commas"
          />
          <p className="text-sm text-muted-foreground mt-1">
            {((preferences?.custom_words?.length || 0) / 240 * 100).toFixed(0)}% of maximum length
          </p>
        </div>
      </div>
    </div>
  );
};
