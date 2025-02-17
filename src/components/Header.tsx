
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

export const Header = () => {
  const navigate = useNavigate();

  return (
    <header className="fixed w-full top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-gray-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <a href="/" className="text-xl font-bold text-primary">
              InsightScribe
            </a>
          </div>
          
          <nav className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900">
              Features
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900">
              Pricing
            </a>
          </nav>

          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={() => navigate("/login")}
            >
              Login
            </Button>
            <Button
              onClick={() => navigate("/signup")}
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Sign Up
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};
