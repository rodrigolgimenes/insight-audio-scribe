
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthProvider';
import { supabase } from '@/integrations/supabase/client';
import type { UserProfile, Subscription } from './types';
import { AccountInfo } from './sections/AccountInfo';
import { PasswordSection } from './sections/PasswordSection';
import { SubscriptionSection } from './sections/SubscriptionSection';
import { OtherActions } from './sections/OtherActions';
import { MeetingPersonaSection } from './sections/MeetingPersonaSection';

export const SettingsContent = () => {
  const { session } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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

      <MeetingPersonaSection />

      <SubscriptionSection isFreePlan={isFreePlan} />

      <OtherActions userId={session?.user?.id as string} />
    </div>
  );
};
