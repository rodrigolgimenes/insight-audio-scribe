
import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FileUpload } from "@/components/shared/FileUpload";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { Hero } from "@/components/landing/Hero";
import { Features } from "@/components/landing/Features";
import { PricingSection } from "@/components/payments/PricingSection";
import { UploadSection } from "@/components/landing/UploadSection";
import { Footer } from "@/components/Footer";
import { AudioWaveform, Mic, PenTool, FileText, Share2 } from "lucide-react";

export default function Index() {
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  const location = useLocation();
  
  // Handle scroll to section on load if needed
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const section = searchParams.get('section');
    
    if (section) {
      const element = document.getElementById(section);
      if (element) {
        setTimeout(() => {
          element.scrollIntoView({ behavior: 'smooth' });
        }, 500);
      }
    }
  }, [location]);
  
  const handleConversionUpdate = (
    status: 'idle' | 'converting' | 'success' | 'error',
    progress: number,
    originalFile: File | null,
    convertedFile: File | null
  ) => {
    setConversionStatus(status);
    setConvertedFile(convertedFile);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <Header />
      
      {/* Hero Section */}
      <Hero />

      {/* Main features with icons */}
      <section id="use-cases" className="py-16 px-4">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How InsightScribe Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-blue-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mic className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Record</h3>
              <p className="text-gray-600">
                Record audio from meetings or upload existing recordings
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-green-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <AudioWaveform className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Transcribe</h3>
              <p className="text-gray-600">
                Advanced AI converts audio to accurate text with speaker detection
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <PenTool className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Analyze</h3>
              <p className="text-gray-600">
                Generate summaries, action items, and key meeting insights
              </p>
            </div>
            
            <div className="text-center">
              <div className="bg-orange-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <Share2 className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Share</h3>
              <p className="text-gray-600">
                Collaborate with your team and share meeting insights
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Features List */}
      <Features />
      
      {/* Upload Section with Card */}
      <UploadSection />
      
      {/* Pricing Section */}
      <PricingSection />
      
      {/* Call to Action */}
      <section className="py-24 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to transform your meetings?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">
            Join thousands of professionals who save time and stay informed with InsightScribe.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              asChild 
              size="lg"
              className="bg-white text-blue-600 hover:bg-gray-100"
            >
              <Link to="/simple-record">Start Recording Now</Link>
            </Button>
            
            <Button 
              asChild 
              variant="outline" 
              size="lg"
              className="border-white text-white hover:bg-white hover:text-blue-600"
            >
              <Link to="/login">Create Free Account</Link>
            </Button>
          </div>
        </div>
      </section>
      
      {/* Footer */}
      <Footer />
    </div>
  );
}
