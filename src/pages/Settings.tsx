
import React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { SidebarProvider } from '@/components/ui/sidebar';

const Settings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar activePage="settings" />
        <div className="flex-1 p-6">
          <SettingsContent />
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
