
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { UserPreferences, UserProfile, Subscription } from './types';
import { AccountInfo } from './sections/AccountInfo';
import { PasswordSection } from './sections/PasswordSection';
import { PreferencesSection } from './sections/PreferencesSection';
import { SubscriptionSection } from './sections/SubscriptionSection';
import { OtherActions } from './sections/OtherActions';

const defaultPreferences: UserPreferences = {
  user_id: '',
  preferred_language: 'auto',
  default_style: 'note',
  custom_words: '',
  default_microphone: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

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
        .select('first_name, last_name, email')
        .eq('id', session?.user?.id)
        .single();

      if (error) throw error;
      
      if (data?.first_name) {
        setFirstName(data.first_name);
      }
      if (data?.last_name) {
        setLastName(data.last_name);
      }
      if (data?.email) {
        setEmail(data.email);
      }
      
      return data as UserProfile;
    },
    enabled: !!session?.user?.id,
  });

  // Fetch user preferences
  const { data: preferences = defaultPreferences } = useQuery({
    queryKey: ['user_preferences'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('user_preferences')
        .select('*')
        .eq('user_id', session?.user?.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        return data as UserPreferences;
      }

      return {
        ...defaultPreferences,
        user_id: session?.user?.id as string,
      };
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

  // Update preferences mutation
  const updatePreferences = useMutation({
    mutationFn: async (newPreferences: Partial<UserPreferences>) => {
      const dataToUpdate = {
        ...preferences,
        ...newPreferences,
        user_id: session?.user?.id,
        updated_at: new Date().toISOString(),
      } as UserPreferences;

      const { error } = await (supabase as any)
        .from('user_preferences')
        .upsert(dataToUpdate);

      if (error) throw error;
    },
  });

  const isFreePlan = !subscription || subscription.status !== 'active';

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account settings and preferences</p>
      </div>

      <AccountInfo
        firstName={firstName}
        lastName={lastName}
        email={email}
        userId={session?.user?.id as string}
        onFirstNameChange={setFirstName}
        onLastNameChange={setLastName}
        onEmailChange={setEmail}
      />

      <PasswordSection
        newPassword={newPassword}
        confirmPassword={confirmPassword}
        onNewPasswordChange={setNewPassword}
        onConfirmPasswordChange={setConfirmPassword}
      />

      <PreferencesSection
        preferences={preferences}
        onPreferencesChange={(newPrefs) => updatePreferences.mutate(newPrefs)}
        languageOptions={languageOptions}
        styleOptions={styleOptions}
      />

      <SubscriptionSection isFreePlan={isFreePlan} />

      <OtherActions userId={session?.user?.id as string} />
    </div>
  );
};
