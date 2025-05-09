
import { Navigate } from "react-router-dom";

// This component is no longer used, redirect to the main app page
const FolderPage = () => {
  return <Navigate to="/app" replace />;
};

export default FolderPage;
