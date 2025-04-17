
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ShellLayout } from '@/components/layouts/ShellLayout';

export default function NotFound() {
  return (
    <ShellLayout>
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-r from-blue-50 to-indigo-50 px-4">
        <div className="max-w-md text-center">
          <h1 className="text-6xl font-bold text-blue-600 mb-4">404</h1>
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
          <p className="text-gray-600 mb-8">
            The page you are looking for doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button asChild size="lg" className="bg-blue-500 hover:bg-blue-600 text-white">
              <Link to="/">
                Return to Home
              </Link>
            </Button>
            
            <Button asChild variant="outline" size="lg">
              <Link to="/simple-record">
                Go to Recording
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </ShellLayout>
  );
}
