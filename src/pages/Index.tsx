
import React, { useEffect } from "react";
import { ShellLayout } from "@/components/layouts/ShellLayout";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { UploadSection } from "@/components/landing/UploadSection";
import { toast } from "sonner";

export default function Index() {
  useEffect(() => {
    // Add logging to track component mounting
    console.log("Index component mounted");
    
    // Catch errors at component level
    return () => {
      console.log("Index component unmounted");
    };
  }, []);

  try {
    return (
      <ShellLayout>
        <Hero />
        <Features />
        <UploadSection />
      </ShellLayout>
    );
  } catch (error) {
    console.error("Error rendering Index page:", error);
    toast.error("Failed to load homepage");
    
    // Fallback UI if there's an error
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
        <h1 className="text-2xl font-semibold mb-4">Something went wrong</h1>
        <p className="text-gray-600">We're having trouble loading the homepage. Please try again later.</p>
      </div>
    );
  }
}
