import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { Navigate, useNavigate } from "react-router-dom";

export default function Home() {
const navigate = useNavigate();



  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
     HOMEPAGE
     <button onClick={()=> navigate('/admin')}>Admin</button>
     <button onClick={()=> navigate('/user')}>User</button>

    </div>
  );
}
