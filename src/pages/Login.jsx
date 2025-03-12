import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success) {
      navigate("/");
    } else {
      alert(result.message);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-gray-800">
      <h2 className="text-5xl text-white tracking-widest font-bold mb-4">Login</h2>
      <form className="w-80 bg-white mt-10 p-6 shadow-md rounded-md" onSubmit={handleLogin}>
        <input 
          className="border p-2 w-full my-2 rounded-md" 
          placeholder="Email" 
          value={email} 
          onChange={(e) => setEmail(e.target.value)} 
        />
        <input 
          className="border p-2 w-full my-2 rounded-md" 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)} 
        />
        <button className="bg-black text-white p-2 w-full rounded-md">Login</button>
      </form>

      <p className="text-white mt-4">
        ไม่มีบัญชี?{" "}
        <Link to="/register" className="text-blue-400 underline">สมัครสมาชิก</Link>
      </p>
    </div>
  );
}
