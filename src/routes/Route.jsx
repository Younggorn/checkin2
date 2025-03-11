import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext";
import Report from "../pages/Report";
import User from "../pages/User";
import Layout from "../layout/layout"; 

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null; 

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route path="/" element={<Home />} />

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/report" element={<Report />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin"]} />}>
            <Route path="/user" element={<User />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
