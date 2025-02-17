
export const Footer = () => {
  return (
    <footer className="bg-white border-t border-gray-100">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="text-lg font-bold mb-4">InsightScribe</h3>
            <p className="text-gray-600">
              Transform your meetings into actionable insights with AI-powered transcription.
            </p>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#features" className="text-gray-600 hover:text-gray-900">
                  Features
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-gray-600 hover:text-gray-900">
                  Pricing
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <p className="text-gray-600">
              support@insightscribe.com<br />
              1-800-INSIGHT
            </p>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t border-gray-100 text-center text-gray-600">
          <p>&copy; {new Date().getFullYear()} InsightScribe. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};
