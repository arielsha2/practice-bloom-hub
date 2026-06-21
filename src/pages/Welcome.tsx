import { Navigate } from "react-router-dom";

// Trial program ended — /welcome is no longer the post-signup landing.
// Existing links redirect straight to the Mentor (which shows the sales
// page for users without access, and the chat for users with access).
export default function Welcome() {
  return <Navigate to="/mentor" replace />;
}
