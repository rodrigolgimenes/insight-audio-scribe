
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { Text, LogOut, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

interface OtherActionsProps {
  userId: string;
}

export const OtherActions = ({ userId }: OtherActionsProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.admin.deleteUser(userId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Account Deleted",
        description: "Your account has been permanently deleted.",
      });
      navigate('/');
    },
    onError: () => {
      toast({
        title: "Delete Failed",
        description: "Failed to delete account. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Logout Failed",
        description: "Failed to log out. Please try again.",
        variant: "destructive",
      });
    } else {
      navigate('/');
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Text className="w-5 h-5" />
        <h2 className="text-xl font-semibold">Other Actions</h2>
      </div>
      <Separator />
      <div className="flex flex-col sm:flex-row gap-4">
        <Button
          variant="outline"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
        
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your
                account and remove all your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => deleteAccount.mutate()}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};
