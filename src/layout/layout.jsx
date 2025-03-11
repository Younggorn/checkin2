import Sidebar from "../components/SideBar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-5">
        <Outlet />
      </main>
    </div>
  );
}
