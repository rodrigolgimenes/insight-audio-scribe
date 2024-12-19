import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";
import { useState } from "react";

export const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 right-0 bg-white/80 backdrop-blur-md z-50 border-b">
      <div className="container mx-auto px-4 py-4">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold gradient-text">InsightScribe</span>
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-gray-600 hover:text-primary transition-colors">
              Features
            </a>
            <a href="#use-cases" className="text-gray-600 hover:text-primary transition-colors">
              Use Cases
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-primary transition-colors">
              Pricing
            </a>
            <a href="#faq" className="text-gray-600 hover:text-primary transition-colors">
              FAQ
            </a>
            <Button variant="default" className="bg-primary hover:bg-primary-dark">
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
            <a
              href="#features"
              className="block text-gray-600 hover:text-primary transition-colors"
            >
              Features
            </a>
            <a
              href="#use-cases"
              className="block text-gray-600 hover:text-primary transition-colors"
            >
              Use Cases
            </a>
            <a
              href="#pricing"
              className="block text-gray-600 hover:text-primary transition-colors"
            >
              Pricing
            </a>
            <a href="#faq" className="block text-gray-600 hover:text-primary transition-colors">
              FAQ
            </a>
            <Button variant="default" className="w-full bg-primary hover:bg-primary-dark">
              Get Started
            </Button>
          </div>
        )}
      </div>
    </header>
  );
};