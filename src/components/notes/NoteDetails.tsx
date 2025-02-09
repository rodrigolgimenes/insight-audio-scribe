
import { useParams } from "react-router-dom";
import { NoteTags } from "./NoteTags";
import { NoteSummary } from "./NoteSummary";
import { ProjectDetails } from "./ProjectDetails";
import { RiskManagement } from "./RiskManagement";
import { ActionItems } from "./ActionItems";

export const NoteDetails = () => {
  const { noteId } = useParams();

  if (!noteId) {
    return null;
  }

  return (
    <>
      <NoteTags noteId={noteId} />
      <div className="space-y-6">
        <NoteSummary />
        <ProjectDetails />
        <RiskManagement />
        <ActionItems />
      </div>
    </>
  );
};
