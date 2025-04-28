
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleGetStarted = () => {
    navigate("/login");
  };

  const scrollToSection = (sectionId: string) => {
    if (location.pathname !== '/') {
      navigate('/?section=' + sectionId);
      return;
    }
    
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
    setIsMenuOpen(false);
  };

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link to="/" className="text-2xl font-bold text-blue-600">InsightScribe</Link>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <button
              onClick={() => scrollToSection('features')}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </button>
            <Link 
              to="/app" 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Button 
              variant="default" 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <Menu className="h-6 w-6" />
          </button>
        </nav>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden py-4 space-y-4">
            <button
              onClick={() => scrollToSection('features')}
              className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection('use-cases')}
              className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors"
            >
              Use Cases
            </button>
            <button
              onClick={() => scrollToSection('pricing')}
              className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors"
            >
              Pricing
            </button>
            <Link 
              to="/app"
              className="block w-full text-left text-gray-600 hover:text-blue-600 transition-colors"
            >
              Dashboard
            </Link>
            <Button 
              variant="default" 
              className="w-full bg-blue-600 hover:bg-blue-700"
              onClick={handleGetStarted}
            >
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};
