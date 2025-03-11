import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, permissions, loading } = useAuth();

  if (loading) return <p>Loading...</p>;

  if (!user || permissions.length === 0) return <Navigate to="/login" replace />;

  const hasPermission = permissions.some((perm) => allowedRoles.includes(perm));

  return hasPermission ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
