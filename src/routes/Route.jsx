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
import Layout from "../layout/layout";
import ReportAll from "../pages/ReportAll";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route element={<ProtectedRoute allowedRoles={["user", "Admin"]} />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin"]} />}>
            <Route path="/report" element={<Report />} />
          </Route>
          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/reportAll" element={<ReportAll />} />
          </Route>
        </Route>
      </Routes>
    </Router>
  );
}
