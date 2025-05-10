
import React from "react";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export const ShellLayout = ({ children }: ShellLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <main className="flex-1">
        {children}
      </main>
    </div>
  );
};
