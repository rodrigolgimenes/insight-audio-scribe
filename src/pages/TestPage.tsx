import { useState } from "react";
import { AppSidebar } from "@/components/AppSidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const TestPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<{
    prompt?: string;
    response?: string;
    error?: string;
  }>({});
  const { toast } = useToast();

  const handleTestPrompt = async () => {
    setIsLoading(true);
    try {
      const fixedPrompt = "95% das empresas usam o WhatsApp para interagir com seus clientes, 79% dos brasileiros já interagiram com empresas e mais...";
      
      console.log('Sending test prompt to OpenAI...');
      const { data, error } = await supabase.functions.invoke('process-with-style', {
        body: { 
          transcript: fixedPrompt,
          styleId: 'test'
        },
      });

      if (error) {
        console.error('Error from edge function:', error);
        setDebugInfo(prev => ({ ...prev, error: error.message }));
        toast({
          title: "Error",
          description: "Failed to process text with OpenAI",
          variant: "destructive",
        });
        return;
      }

      console.log('Response from OpenAI:', data);
      setResult(data.content);
      setDebugInfo({
        prompt: data.fullPrompt,
        response: data.content,
      });

      toast({
        title: "Success",
        description: "Text processed successfully",
      });
    } catch (error) {
      console.error('Error testing prompt:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full bg-gray-50">
        <AppSidebar activePage="test" />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <h1 className="text-3xl font-bold">OpenAI Prompt Test Page</h1>
            
            <div className="space-y-4">
              <Button 
                onClick={handleTestPrompt}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Test Fixed Prompt"}
              </Button>

              {/* Debug Information */}
              <div className="space-y-6 mt-8">
                <div className="border rounded-lg p-6 bg-white">
                  <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
                  
                  {debugInfo.prompt && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">Complete Prompt:</h3>
                      <pre className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                        {debugInfo.prompt}
                      </pre>
                    </div>
                  )}

                  {debugInfo.response && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-gray-700 mb-2">OpenAI Response:</h3>
                      <pre className="bg-gray-50 p-4 rounded-md whitespace-pre-wrap text-sm">
                        {debugInfo.response}
                      </pre>
                    </div>
                  )}

                  {debugInfo.error && (
                    <div className="mb-6">
                      <h3 className="text-lg font-medium text-red-700 mb-2">Error:</h3>
                      <pre className="bg-red-50 p-4 rounded-md whitespace-pre-wrap text-sm text-red-600">
                        {debugInfo.error}
                      </pre>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default TestPage;