
import React from "react";

interface AppPageHeaderProps {
  title: string;
  description: string;
}

export const AppPageHeader = ({ title, description }: AppPageHeaderProps) => {
  return (
    <div className="mb-6">
      <h1 className="text-2xl font-bold">{title}</h1>
      <p className="text-muted-foreground mt-1">{description}</p>
    </div>
  );
};
