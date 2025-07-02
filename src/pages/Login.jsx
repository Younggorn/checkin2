import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import Swal from "sweetalert2";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      Swal.fire({
        icon: "warning",
        title: "กรุณากรอกข้อมูลให้ครบถ้วน",
        text: "กรุณากรอกอีเมลและรหัสผ่าน",
        confirmButtonText: "ตกลง"
      });
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        // แสดง SweetAlert สำหรับการเข้าสู่ระบบสำเร็จ
        await Swal.fire({
          icon: "success",
          title: "เข้าสู่ระบบสำเร็จ",
          text: "ยินดีต้อนรับเข้าสู่ระบบ",
          confirmButtonText: "เข้าสู่ระบบ",
          timer: 2000,
          timerProgressBar: true,
          showConfirmButton: false
        });
        
        navigate("/");
      } else {
        // แสดง SweetAlert สำหรับข้อผิดพลาด
        let swalConfig = {
          icon: "error",
          title: "เข้าสู่ระบบไม่สำเร็จ",
          text: result.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ",
          confirmButtonText: "ลองอีกครั้ง"
        };

        // ปรับแต่งข้อความตามประเภทข้อผิดพลาด
        if (result.message?.includes("User not found") || result.message?.includes("ไม่พบผู้ใช้งาน")) {
          swalConfig = {
            ...swalConfig,
            title: "ไม่พบผู้ใช้งาน",
            text: "ไม่พบอีเมลนี้ในระบบ กรุณาตรวจสอบอีเมลอีกครั้ง"
          };
        } else if (result.message?.includes("Wrong password") || result.message?.includes("รหัสผ่านไม่ถูกต้อง")) {
          swalConfig = {
            ...swalConfig,
            title: "รหัสผ่านไม่ถูกต้อง",
            text: "กรุณาตรวจสอบรหัสผ่านอีกครั้ง"
          };
        } else if (result.message?.includes("not approved") || result.message?.includes("รอการอนุมัติ")) {
          swalConfig = {
            ...swalConfig,
            icon: "warning",
            title: "รอการอนุมัติ",
            text: "บัญชีของคุณยังไม่ได้รับการอนุมัติจากผู้ดูแลระบบ กรุณารอการอนุมัติ",
            confirmButtonText: "เข้าใจแล้ว"
          };
        }

        Swal.fire(swalConfig);
      }
    } catch (error) {
      console.error("Login error:", error);
      Swal.fire({
        icon: "error",
        title: "เกิดข้อผิดพลาด",
        text: "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กรุณาลองใหม่อีกครั้ง",
        confirmButtonText: "ตกลง"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen w-full bg-gray-800">
      <h2 className="text-5xl text-white tracking-widest font-bold mb-4">Login</h2>
      <form className="w-80 bg-white mt-10 p-6 shadow-md rounded-md" onSubmit={handleLogin}>
        <input 
          className="border p-2 w-full my-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="Email" 
          type="email"
          value={email} 
          onChange={(e) => setEmail(e.target.value)}
          disabled={isLoading}
        />
        <input 
          className="border p-2 w-full my-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
          placeholder="Password" 
          type="password" 
          value={password} 
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading}
        />
        <button 
          className="bg-black text-white p-2 w-full rounded-md hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              กำลังเข้าสู่ระบบ...
            </>
          ) : (
            "Login"
          )}
        </button>
      </form>

      <p className="text-white mt-4">
        ไม่มีบัญชี?{" "}
        <Link to="/register" className="text-blue-400 underline hover:text-blue-300">
          สมัครสมาชิก
        </Link>
      </p>
    </div>
  );
}