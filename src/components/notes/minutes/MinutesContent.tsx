
import ReactMarkdown from 'react-markdown';

interface MinutesContentProps {
  content: string;
}

export const MinutesContent = ({ content }: MinutesContentProps) => {
  return (
    <div className="prose prose-sm md:prose-base lg:prose-lg max-w-none">
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-2xl font-bold text-gray-900 mb-4">{children}</h1>,
          h2: ({ children }) => <h2 className="text-xl font-semibold text-gray-800 mb-3">{children}</h2>,
          h3: ({ children }) => <h3 className="text-lg font-medium text-gray-700 mb-2">{children}</h3>,
          ul: ({ children }) => <ul className="list-disc pl-6 space-y-2 text-gray-600">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal pl-6 space-y-2 text-gray-600">{children}</ol>,
          p: ({ children }) => <p className="text-gray-600 mb-4 leading-relaxed">{children}</p>,
          strong: ({ children }) => <strong className="font-semibold text-gray-900">{children}</strong>,
          em: ({ children }) => <em className="text-gray-700 italic">{children}</em>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};
