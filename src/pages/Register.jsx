import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Swal from "sweetalert2"; // ✅ Import SweetAlert2

export default function Register() {
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/register`, {
        firstname,
        lastname,
        email,
        password,
      });

      if (response.data.status === "success") {
        Swal.fire({
          icon: "success",
          title: "สมัครสมาชิกสำเร็จ!",
          text: "คุณสามารถเข้าสู่ระบบได้ทันที",
          timer: 2000,
          showConfirmButton: false,
        });
        setTimeout(() => navigate("/login"), 2000); // ✅ รอแล้วเด้งไป Login
      } else {
        Swal.fire({
          icon: "error",
          title: "สมัครสมาชิกไม่สำเร็จ!",
          text: response.data.message || "เกิดข้อผิดพลาด กรุณาลองใหม่",
        });
      }
    } catch (error) {
      console.error("Register Error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด!",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้",
      });
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-gray-800">
      <h2 className="text-5xl text-white tracking-widest font-bold mb-4">Register</h2>
      <form className="w-80 bg-white mt-10 p-6 shadow-md rounded-md" onSubmit={handleRegister}>
        <input 
          className="border p-2 w-full my-2 rounded-md" 
          placeholder="First Name" 
          value={firstname} 
          onChange={(e) => setFirstname(e.target.value)} 
        />
        <input 
          className="border p-2 w-full my-2 rounded-md" 
          placeholder="Last Name" 
          value={lastname} 
          onChange={(e) => setLastname(e.target.value)} 
        />
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
        <button className="bg-black text-white p-2 w-full rounded-md">Register</button>
      </form>

      {/* ✅ ปุ่มกลับไปหน้า Login */}
      <p className="text-white mt-4">
        มีบัญชีแล้ว?{" "}
        <button onClick={() => navigate("/login")} className="text-blue-400 underline">
          เข้าสู่ระบบ
        </button>
      </p>
    </div>
  );
}
