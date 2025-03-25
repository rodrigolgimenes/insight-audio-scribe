
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { FileUpload } from "@/components/shared/FileUpload";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function Index() {
  const [convertedFile, setConvertedFile] = useState<File | null>(null);
  const [conversionStatus, setConversionStatus] = useState<'idle' | 'converting' | 'success' | 'error'>('idle');
  
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
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50">
      <div className="max-w-3xl text-center px-4">
        <h1 className="text-4xl font-bold text-blue-600 mb-6">
          Audio Recording App
        </h1>
        <p className="text-lg text-gray-700 mb-8">
          A powerful tool for recording, transcribing, and managing your audio notes
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
            <Link to="/simple-record">
              Go to Recording Page
            </Link>
          </Button>
          
          <Button asChild variant="outline" size="lg">
            <Link to="/app">
              Dashboard
            </Link>
          </Button>
        </div>
        
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle>Audio File Upload</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload 
              onConversionUpdate={handleConversionUpdate}
              buttonText="Upload Audio File"
              description="Upload MP3 files directly or convert other audio formats"
              buttonClassName="w-full"
            />
            
            {conversionStatus === 'success' && (
              <p className="text-green-600 mt-4">
                Conversion successful! Your file is ready.
              </p>
            )}
            
            {conversionStatus === 'error' && (
              <p className="text-red-600 mt-4">
                There was an error processing your file. Please try again.
              </p>
            )}
            
            {conversionStatus === 'converting' && (
              <p className="text-blue-600 mt-4">
                Processing your audio file...
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
