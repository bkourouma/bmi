import { Navigate } from "react-router-dom";

export default function PrivateRoute({ children }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const username = localStorage.getItem("username");
  
  if (!isLoggedIn || !username) {
    // Clear any stale data
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    return <Navigate to="/login" replace />;
  }
  return children;
}
