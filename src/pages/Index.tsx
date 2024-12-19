import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import {
  AudioWaveform,
  FileText,
  ListChecks,
  ChartBar,
  Calendar,
  BookOpen,
  ArrowRight,
} from "lucide-react";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      {/* Hero Section */}
      <section className="pt-32 pb-16 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-5xl md:text-6xl font-bold mb-6">
                Never Miss a Meeting
                <span className="gradient-text block">Insight Again</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8">
                Transform your meetings into actionable insights with AI-powered transcription and
                summarization. Stay informed without being present.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="bg-primary hover:bg-primary-dark">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button size="lg" variant="outline">
                  Watch Demo
                </Button>
              </div>
            </div>
            <div className="bg-primary-light p-8 rounded-2xl animate-float">
              <div className="bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Record Meeting</h3>
                  <span className="text-gray-500">00:00</span>
                </div>
                <Button className="w-full bg-primary hover:bg-primary-dark mb-4">
                  <AudioWaveform className="mr-2 h-5 w-5" />
                  Start Recording
                </Button>
                <div className="text-center text-gray-500">
                  or drag and drop audio file here
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Everything you need to stay informed
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <FileText className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Smart Transcription</h3>
              <p className="text-gray-600">
                Accurate transcription with speaker detection and noise reduction.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ListChecks className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Key Points Summary</h3>
              <p className="text-gray-600">
                AI-generated summaries highlighting decisions and action items.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <ChartBar className="h-12 w-12 text-primary mb-4" />
              <h3 className="text-xl font-semibold mb-2">Context Awareness</h3>
              <p className="text-gray-600">
                Smart insights based on previous meetings and internal documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section id="use-cases" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Perfect for every meeting
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-6 border rounded-xl hover:border-primary transition-colors">
              <Calendar className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Team Meetings</h3>
              <p className="text-gray-600">Keep everyone aligned with detailed summaries.</p>
            </div>
            <div className="p-6 border rounded-xl hover:border-primary transition-colors">
              <BookOpen className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Client Calls</h3>
              <p className="text-gray-600">Never miss important client requirements.</p>
            </div>
            <div className="p-6 border rounded-xl hover:border-primary transition-colors">
              <AudioWaveform className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Interviews</h3>
              <p className="text-gray-600">Focus on the conversation, not note-taking.</p>
            </div>
            <div className="p-6 border rounded-xl hover:border-primary transition-colors">
              <FileText className="h-8 w-8 text-primary mb-4" />
              <h3 className="font-semibold mb-2">Workshops</h3>
              <p className="text-gray-600">Capture every valuable insight and idea.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Simple, transparent pricing
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Starter</h3>
              <div className="text-3xl font-bold mb-4">$9<span className="text-lg text-gray-500">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>5 hours of recording/mo</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>Basic summaries</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>7-day history</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Start Free Trial
              </Button>
            </div>
            <div className="bg-primary p-8 rounded-xl shadow-lg text-white transform scale-105">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-dark text-white px-4 py-1 rounded-full text-sm">
                Most Popular
              </div>
              <h3 className="text-xl font-semibold mb-2">Pro</h3>
              <div className="text-3xl font-bold mb-4">$29<span className="text-lg opacity-75">/mo</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>20 hours of recording/mo</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>Advanced AI summaries</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>30-day history</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 mr-2" />
                  <span>Custom exports</span>
                </li>
              </ul>
              <Button className="w-full bg-white text-primary hover:bg-gray-100">
                Start Free Trial
              </Button>
            </div>
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h3 className="text-xl font-semibold mb-2">Enterprise</h3>
              <div className="text-3xl font-bold mb-4">Custom</div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited recording</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>Custom AI models</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>Unlimited history</span>
                </li>
                <li className="flex items-center">
                  <ListChecks className="h-5 w-5 text-primary mr-2" />
                  <span>Priority support</span>
                </li>
              </ul>
              <Button className="w-full" variant="outline">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>
          <div className="max-w-3xl mx-auto space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">How accurate is the transcription?</h3>
              <p className="text-gray-600">
                Our AI-powered transcription achieves over 95% accuracy for clear audio recordings.
                The accuracy improves over time as our models learn from your specific context.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">What file formats are supported?</h3>
              <p className="text-gray-600">
                We support all major audio formats including MP3, WAV, M4A, and more. You can
                also record directly through our platform.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <h3 className="text-lg font-semibold mb-2">Is my data secure?</h3>
              <p className="text-gray-600">
                Yes, we use enterprise-grade encryption for all data storage and transmission.
                Your data is processed in compliance with GDPR and other privacy regulations.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Index;