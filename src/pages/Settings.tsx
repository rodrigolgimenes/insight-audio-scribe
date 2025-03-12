
import React from 'react';
import { AppSidebar } from '@/components/AppSidebar';
import { SettingsContent } from '@/components/settings/SettingsContent';
import { SidebarProvider } from '@/components/ui/sidebar';

const Settings = () => {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-ghost-white">
        <AppSidebar activePage="settings" />
        <div className="flex-1 bg-ghost-white">
          <div className="p-6">
            <SettingsContent />
          </div>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Settings;
