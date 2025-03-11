import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [permissions, setPermissions] = useState([]);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/user/login`, { email, password });
      const token = response.data.authorization.token;

      localStorage.setItem("token", token);

      const decoded = jwtDecode(token);
      console.log("Decoded JWT:", decoded);

      const userData = {
        id: decoded.userid,
        fname: decoded.fname,
        lname: decoded.lname,
        permissions: decoded.permission ? [decoded.permission] : [],
        exp: decoded.exp, 
      };

      localStorage.setItem("user", JSON.stringify(userData)); // ✅ เก็บ user ลง LocalStorage ด้วย
      setUser(userData);
      setPermissions(userData.permissions);

      return { success: true };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, message: error.response?.data?.message || "Login failed" };
    }
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user"); 
    setUser(null);
    setPermissions([]);
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    const storedUser = localStorage.getItem("user");

    if (token && storedUser) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; 

        if (decoded.exp < currentTime) {
          console.warn("Token expired, logging out...");
          logout(); 
          return;
        }

        setUser(JSON.parse(storedUser)); // ✅ ดึง user จาก LocalStorage มาใช้
        setPermissions(decoded.permission ? [decoded.permission] : []);
      } catch (error) {
        console.error("Invalid Token:", error);
        logout(); 
      }
    }
    setLoading(false);
  }, []);

  return (
    <AuthContext.Provider value={{ user, permissions, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
