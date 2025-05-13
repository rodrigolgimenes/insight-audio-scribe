import React from "react";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface MeetingMinutesContentProps {
  content: string | null;
  onEdit: () => void;
  isLoading: boolean;
}

export const MeetingMinutesContent: React.FC<MeetingMinutesContentProps> = ({
  content,
  onEdit,
  isLoading
}) => {
  // This is a placeholder structure for meeting minutes
  // In a real implementation, you'd parse the content and structure it accordingly
  const minutesContent = content ? parseMinutesContent(content) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Meeting Minutes</h2>
        <Button
          onClick={onEdit}
          variant="outline"
          className="gap-2"
          disabled={isLoading}
        >
          <Edit2 className="h-4 w-4" />
          Edit Meeting Minutes
        </Button>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <div className="flex flex-col items-center">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mb-2"></div>
            <p className="text-gray-500">Loading meeting minutes...</p>
          </div>
        </div>
      ) : content ? (
        <div className="space-y-6 bg-white rounded-lg border border-gray-200 p-6">
          {minutesContent ? (
            <>
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Date & Time</h3>
                <p>{minutesContent.dateTime || "Not specified"}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Participants</h3>
                {minutesContent.participants?.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {minutesContent.participants.map((participant, index) => (
                      <li key={index}>{participant}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No participants listed</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Meeting Objective</h3>
                <p>{minutesContent.objective || "Not specified"}</p>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Discussion Points</h3>
                {minutesContent.discussionPoints?.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {minutesContent.discussionPoints.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No discussion points listed</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Action Items</h3>
                {minutesContent.actionItems?.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {minutesContent.actionItems.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No action items listed</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-lg font-medium">Decisions Made</h3>
                {minutesContent.decisions?.length > 0 ? (
                  <ul className="list-disc pl-6">
                    {minutesContent.decisions.map((decision, index) => (
                      <li key={index}>{decision}</li>
                    ))}
                  </ul>
                ) : (
                  <p>No decisions listed</p>
                )}
              </div>
            </>
          ) : (
            <div className="prose prose-blue max-w-none dark:prose-invert">
              {content}
            </div>
          )}
        </div>
      ) : (
        <div className="h-40 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-200">
          <p className="text-gray-500">No meeting minutes available yet</p>
        </div>
      )}
    </div>
  );
};

// Helper function to parse meeting minutes content
// This is a simplified example - in a real implementation,
// you would need more robust parsing logic
function parseMinutesContent(content: string) {
  try {
    // Check if content is already structured (e.g., in JSON format)
    if (content.startsWith('{') && content.endsWith('}')) {
      return JSON.parse(content);
    }
    
    // Otherwise, try to parse markdown or plain text format
    const sections: {
      dateTime?: string;
      participants?: string[];
      objective?: string;
      discussionPoints?: string[];
      actionItems?: string[];
      decisions?: string[];
    } = {};
    
    // Very basic parsing logic - you might need more sophisticated parsing
    if (content.includes('Date & Time:')) {
      const match = content.match(/Date & Time:([^\n]*)/);
      sections.dateTime = match ? match[1].trim() : undefined;
    }
    
    if (content.includes('Participants:')) {
      const participantsSection = content.match(/Participants:(.*?)(?=##|$)/s);
      if (participantsSection) {
        sections.participants = participantsSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.trim().replace(/^[-*]\s+/, ''));
      }
    }
    
    if (content.includes('Meeting Objective:')) {
      const match = content.match(/Meeting Objective:([^\n]*)/);
      sections.objective = match ? match[1].trim() : undefined;
    }
    
    if (content.includes('Discussion Points:')) {
      const discussionSection = content.match(/Discussion Points:(.*?)(?=##|$)/s);
      if (discussionSection) {
        sections.discussionPoints = discussionSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.trim().replace(/^[-*]\s+/, ''));
      }
    }
    
    if (content.includes('Action Items:')) {
      const actionSection = content.match(/Action Items:(.*?)(?=##|$)/s);
      if (actionSection) {
        sections.actionItems = actionSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.trim().replace(/^[-*]\s+/, ''));
      }
    }
    
    if (content.includes('Decisions Made:')) {
      const decisionsSection = content.match(/Decisions Made:(.*?)(?=##|$)/s);
      if (decisionsSection) {
        sections.decisions = decisionsSection[1]
          .split('\n')
          .filter(line => line.trim().startsWith('-') || line.trim().startsWith('*'))
          .map(line => line.trim().replace(/^[-*]\s+/, ''));
      }
    }
    
    return Object.keys(sections).length > 0 ? sections : null;
  } catch (error) {
    console.error('Error parsing meeting minutes:', error);
    return null;
  }
}
