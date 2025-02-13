
import React from 'react';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Lock } from 'lucide-react';

interface PasswordSectionProps {
  newPassword: string;
  confirmPassword: string;
  onNewPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
}

export const PasswordSection = ({
  newPassword,
  confirmPassword,
  onNewPasswordChange,
  onConfirmPasswordChange,
}: PasswordSectionProps) => {
  const { toast } = useToast();

  const updatePassword = useMutation({
    mutationFn: async () => {
      if (newPassword !== confirmPassword) {
        throw new Error("Passwords don't match");
      }

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Password Updated",
        description: "Your password has been successfully updated.",
      });
      onNewPasswordChange('');
      onConfirmPasswordChange('');
    },
    onError: (error) => {
      toast({
        title: "Password Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Lock className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Change Password</h2>
      </div>
      <Separator />
      <div className="space-y-4">
        <div>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => onNewPasswordChange(e.target.value)}
          />
        </div>
        <div>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
          />
        </div>
      </div>
      <Button onClick={() => updatePassword.mutate()}>
        Update Password
      </Button>
    </div>
  );
};
