
import { CheckCircle2 } from "lucide-react";

export const Features = () => {
  const features = [
    "AI-Powered Transcription",
    "Real-time Meeting Summaries",
    "Action Item Extraction",
    "Searchable Archives",
    "Team Collaboration",
    "Custom Meeting Templates"
  ];

  return (
    <section className="py-16 px-4 bg-gray-50">
      <div className="container mx-auto">
        <h2 className="text-3xl font-bold text-center mb-12 text-gray-900">
          Features that Make Meetings Matter
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="flex items-center p-4 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow"
            >
              <CheckCircle2 className="w-6 h-6 text-primary mr-3" />
              <span className="text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
