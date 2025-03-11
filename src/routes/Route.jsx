import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";

import ProtectedRoute from "./ProtectedRoute";
import { useAuth } from "../context/AuthContext"; 
import Admin from "../pages/Admin";
import User from "../pages/User";

export default function AppRoutes() {
  const { user } = useAuth(); 

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Home /> : <Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />

        <Route element={<ProtectedRoute allowedRoles={["user"]} />}>
            <Route path="/admin" element={<Admin/>} />
        </Route>

        <Route element={<ProtectedRoute allowedRoles={["user", "Admin"]} />}>
        <Route path="/user" element={<User/>} />

        </Route>
      </Routes>
    </Router>
  );
}
