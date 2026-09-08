import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

function DashboardLayout() {
  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-shell">
        <Topbar />

        <div className="main-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default DashboardLayout;