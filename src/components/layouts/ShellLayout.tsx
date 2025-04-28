
import React from "react";
import { Link } from "react-router-dom";

interface ShellLayoutProps {
  children: React.ReactNode;
}

export const ShellLayout: React.FC<ShellLayoutProps> = ({ children }) => {
  console.log("ShellLayout rendering");
  
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="bg-white shadow-sm py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold text-blue-600">InsightScribe</h1>
          <nav>
            <ul className="flex space-x-4">
              <li>
                <Link to="/" className="text-gray-700 hover:text-blue-500">Home</Link>
              </li>
              <li>
                <Link to="/audio-recorder" className="text-gray-700 hover:text-blue-500">Record Audio</Link>
              </li>
              <li>
                <Link to="/app" className="text-gray-700 hover:text-blue-500">Dashboard</Link>
              </li>
              <li>
                <Link to="/SimpleRecord" className="text-gray-700 hover:text-blue-500">Simple Record</Link>
              </li>
              <li>
                <Link to="/settings" className="text-gray-700 hover:text-blue-500">Settings</Link>
              </li>
              <li>
                <Link to="/login" className="text-gray-700 hover:text-blue-500">Login</Link>
              </li>
            </ul>
          </nav>
        </div>
      </header>
      
      <main className="flex-grow">
        {children}
      </main>
      
      <footer className="bg-gray-100 py-6">
        <div className="max-w-7xl mx-auto px-4">
          <p className="text-center text-gray-600">© 2025 InsightScribe. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
