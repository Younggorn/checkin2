import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState, useEffect } from "react";

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [touchStartX, setTouchStartX] = useState(null);
  const [touchEndX, setTouchEndX] = useState(null);

  if (!user) return null;

  const userRoles = user.permissions?.map((role) => role.toLowerCase()) || [];

  const menuItems = [
    { path: "/", label: "Home", roles: ["user", "senior" ,"admin"] },
    { path: "/report", label: "Report", roles: ["user", "senior" ,"admin" ] },
    { path: "/reportAll", label: "Report User", roles: ["superadmin","admin"] },
    { path: "/Approve", label: "Approve", roles: ["senior","admin"] },
    { path: "/CalculateSalary", label: "OT", roles: ["admin"] },
    { path: "/ApproveByAdmin", label: "Approve (ADMIN)", roles: ["admin"] },
  ];

  // 👇 Detect swipe gesture
  useEffect(() => {
    const handleTouchStart = (e) => {
      setTouchStartX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
      setTouchEndX(e.touches[0].clientX);
    };

    const handleTouchEnd = () => {
      if (touchStartX !== null && touchEndX !== null) {
        const distance = touchEndX - touchStartX;

        // 👈 สไลด์ขวาเกิน 75px เพื่อเปิด sidebar
        if (distance > 75 && !isOpen) {
          setIsOpen(true);
        }

        // 👉 สไลด์ซ้ายเกิน 75px เพื่อปิด
        if (distance < -75 && isOpen) {
          setIsOpen(false);
        }
      }

      setTouchStartX(null);
      setTouchEndX(null);
    };

    document.addEventListener("touchstart", handleTouchStart);
    document.addEventListener("touchmove", handleTouchMove);
    document.addEventListener("touchend", handleTouchEnd);

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", handleTouchMove);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [touchStartX, touchEndX, isOpen]);

  return (
    <>
      

      <aside
        className={`
          fixed top-0 left-0 h-screen w-64 bg-gray-800 text-white p-5 flex flex-col justify-between transform transition-transform duration-300 z-50 overflow-y-auto
          ${isOpen ? "translate-x-0" : "-translate-x-full"}
          md:sticky md:top-0 md:h-screen md:translate-x-0
        `}
      >
        <div>
          <h2 className="text-xl font-bold mb-5">GROUPMAKER</h2>
          <ul>
            {menuItems
              .filter((item) =>
                item.roles.some((role) => userRoles.includes(role))
              )
              .map((item) => (
                <li key={item.path} className="mb-3">
                  <Link
                    to={item.path}
                    className="hover:text-gray-400"
                    onClick={() => setIsOpen(false)}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </div>

        <button
          onClick={logout}
          className="mt-5 w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 rounded-md"
        >
          Logout
        </button>
      </aside>

      {isOpen && (
        <div
          className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-10 z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}