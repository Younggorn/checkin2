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
import Register from "../pages/Register";
import CheckinOutsize from "../pages/CheckinOutsize";
import OT from "../pages/OT";
import MyOT from "../pages/MyOT";
import Approve from "../pages/Approve";
import CalculateSalary from "../pages/CalculateSalary"
import ApproveByAdmin from "../pages/ApproveByAdmin";

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return null;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        <Route element={user ? <Layout /> : <Navigate to="/login" replace />}>
          <Route element={<ProtectedRoute allowedRoles={["user","senior", "Admin"]} />}>
            <Route path="/" element={<Home />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin","senior"]} />}>
            <Route path="/report" element={<Report />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin" ,"senior"]} />}>
            <Route path="/checkinOutsize" element={<CheckinOutsize />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin" ,"senior"]} />}>
            <Route path="/OT" element={<OT />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["user", "Admin","senior"]} />}>
            <Route path="/MyOT" element={<MyOT />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/reportAll" element={<ReportAll />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin","senior"]} />}>
            <Route path="/Approve" element={<Approve />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/CalculateSalary" element={<CalculateSalary />} />
          </Route>

          <Route element={<ProtectedRoute allowedRoles={["Admin"]} />}>
            <Route path="/ApproveByAdmin" element={<ApproveByAdmin />} />
          </Route>
          
        </Route>
      </Routes>
    </Router>
  );
}
