
import React from 'react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { InfoIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface DeviceControlsProps {
  session: any;
}

export const DeviceControls: React.FC<DeviceControlsProps> = ({ session }) => {
  const navigate = useNavigate();

  if (session) return null;

  return (
    <Alert variant="default" className="mb-6">
      <InfoIcon className="h-5 w-5" />
      <AlertTitle>Authentication Required</AlertTitle>
      <AlertDescription>
        You must be logged in to save recordings to your account.
        <div className="mt-2">
          <Button 
            variant="outline" 
            onClick={() => navigate('/login')}
            className="mr-2"
          >
            Login
          </Button>
          <Button onClick={() => navigate('/signup')}>
            Sign Up
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
};
