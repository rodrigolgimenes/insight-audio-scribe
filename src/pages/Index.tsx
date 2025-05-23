
import React from "react";
import { ShellLayout } from "@/components/layouts/ShellLayout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { UploadSection } from "@/components/landing/UploadSection";

export default function Index() {
  return (
    <ShellLayout>
      <Hero />
      <Features />
      <UploadSection />
    </ShellLayout>
  );
}
