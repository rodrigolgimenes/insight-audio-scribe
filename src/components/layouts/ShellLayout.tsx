
import React from "react";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export const ShellLayout = ({ children }: ShellLayoutProps) => {
  return (
    <div className="min-h-screen bg-white">
      <main className="min-h-screen">
        {children}
      </main>
    </div>
  );
};
