import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useState } from "react";

export default function Sidebar() {
  const { user, logout } = useAuth(); 
  const [isOpen, setIsOpen] = useState(false); // สถานะเปิด-ปิด Sidebar

  if (!user) return null;

  const userRoles = user.permissions?.map((role) => role.toLowerCase()) || [];

  const menuItems = [
    { path: "/", label: "Home", roles: ["user", "admin"] },
    { path: "/report", label: "Report", roles: ["user", "admin"] },
    { path: "/reportAll", label: "Report User", roles: ["admin"] },
    { path: "/Approve", label: "Approve", roles: ["admin"] },
  ];

  return (
    <>
      <button
        className="absolute top-5 left-5 z-50 text-white bg-gray-800 p-2 rounded-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>

      <aside
        className={`fixed top-0 left-0 h-full md:h-screen w-64 bg-gray-800 text-white p-5 flex flex-col justify-between transform transition-transform duration-300 z-50 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0`}
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
