import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { User, Lock, Mic, Globe, Text, CreditCard, LogOut, Trash2 } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type Tables = Database['public']['Tables'];
type UserPreferences = Tables['user_preferences']['Row'];

interface UserProfile {
  full_name: string | null;
  email: string;
}

interface Subscription {
  status: string;
  price_id: string | null;
}

const languageOptions = [
  { value: 'auto', label: 'Auto Detect' },
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'pt', label: 'Portuguese' },
];

const styleOptions = [
  { value: 'note', label: 'Note' },
  { value: 'meeting', label: 'Meeting Minutes' },
  { value: 'summary', label: 'Summary' },
];

export const SettingsContent = () => {
  const { session } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Fetch user profile
  const { data: profile } = useQuery({
    queryKey: ['profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, email')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      
      if (data?.full_name) {
        const [first, ...rest] = data.full_name.split(' ');
        setFirstName(first);
        setLastName(rest.join(' '));
      }
      if (data?.email) {
        setEmail(data.email);
      }
      
      return data;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch user preferences
  const { data: preferences } = useQuery<UserPreferences>({
    queryKey: ['user_preferences'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      const defaultPreferences: UserPreferences = {
        user_id: session?.user?.id as string,
        preferred_language: 'auto',
        default_style: 'note',
        custom_words: '',
        default_microphone: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      return data || defaultPreferences;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch subscription status
  const { data: subscription } = useQuery<Subscription>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('status, price_id')
        .eq('workspace_id', session?.user?.id)
        .maybeSingle();

      if (error) throw error;
      return data || { status: 'inactive', price_id: null };
    },
    enabled: !!session?.user?.id,
  });

  // Update profile mutation
  const updateProfile = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: `${firstName} ${lastName}`.trim(),
          email,
          updated_at: new Date().toISOString(),
        })
        .eq('id', session?.user?.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update profile. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Update password mutation
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
      setNewPassword('');
      setConfirmPassword('');
    },
    onError: (error) => {
      toast({
        title: "Password Update Failed",
        description: error instanceof Error ? error.message : "Failed to update password",
        variant: "destructive",
      });
    },
  });

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          ...preferences,
          ...newPreferences,
          user_id: session?.user?.id as string,
          updated_at: new Date().toISOString(),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Update Failed",
        description: "Failed to update preferences. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Delete account mutation
  const deleteAccount = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.auth.admin.deleteUser(
        session?.user?.id as string
      );
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

  const handleUpgradeClick = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId: 'price_1Qs3rZRepqC8oahuQ4vCb2Eb' }
      });

      if (error) throw error;

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error('Error creating checkout session:', error);
      toast({
        title: "Error",
        description: "Failed to start checkout process",
        variant: "destructive",
      });
    }
  };

  const isFreePlan = !subscription || subscription.status !== 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      {/* Account Info */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <User className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Account Info</h2>
        </div>
        <Separator />
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => updateProfile.mutate()}>
          Save Changes
        </Button>
      </div>

      {/* Create Password */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Lock className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Create Password</h2>
        </div>
        <Separator />
        <div className="space-y-4">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="confirmPassword">Confirm New Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>
        </div>
        <Button onClick={() => updatePassword.mutate()}>
          Update Password
        </Button>
      </div>

      {/* Preferences */}
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
              onValueChange={(value) => updatePreferences.mutate({ default_microphone: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select microphone" />
              </SelectTrigger>
              <SelectContent>
                {/* This will be populated dynamically */}
                <SelectItem value="default">Default Microphone</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="languageSelect">Language Selection</Label>
            <Select
              value={preferences?.preferred_language || 'auto'}
              onValueChange={(value) => updatePreferences.mutate({ preferred_language: value })}
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
              onValueChange={(value) => updatePreferences.mutate({ default_style: value })}
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
                  updatePreferences.mutate({ custom_words: e.target.value });
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

      {/* Subscription Plan */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-5 h-5" />
          <h2 className="text-xl font-semibold">Subscription Plan</h2>
        </div>
        <Separator />
        <div className="bg-gray-50 p-6 rounded-lg">
          <p className="text-lg font-medium mb-4">
            Current Plan: {isFreePlan ? 'Free Plan' : 'Plus Plan'}
          </p>
          {isFreePlan && (
            <Button
              onClick={handleUpgradeClick}
              className="bg-gradient-to-r from-pink-500 to-purple-500 text-white hover:from-pink-600 hover:to-purple-600"
            >
              Upgrade to Plus
            </Button>
          )}
        </div>
      </div>

      {/* Other Actions */}
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
    </div>
  );
};
