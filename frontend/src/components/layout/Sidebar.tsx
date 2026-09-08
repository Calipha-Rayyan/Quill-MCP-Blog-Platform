import {
  LayoutDashboard,
  FileText,
  KeyRound,
  Settings,
  PenLine,
  LogOut,
  CalendarClock,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { getStoredUser, logout } from "../../services/api";

function getDisplayName(email: string): string {
  const localPart = email.split("@")[0];

  const words = localPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean);

  return words
    .slice(0, 3)
    .map(
      (word) =>
        word.charAt(0).toUpperCase() + word.slice(1),
    )
    .join(" ");
}

function getInitials(name: string): string {
  const parts = name.split(" ").filter(Boolean);

  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Sidebar() {
  const navigate = useNavigate();
  const user = getStoredUser();

  const displayName = user
    ? getDisplayName(user.email)
    : "User";

  const initials = getInitials(displayName);

  function handleLogout() {
    logout();
    navigate("/login");
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">Q</div>
        <span>Quill</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Workspace</p>

        <NavLink
          to="/"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </NavLink>

        <NavLink
          to="/posts"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <FileText size={18} />
          <span>Posts</span>
        </NavLink>

        <NavLink
          to="/editor"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <PenLine size={18} />
          <span>Editor</span>
        </NavLink>

        <NavLink
              to="/scheduled"
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <CalendarClock size={18} />
              <span>Scheduled</span>
            </NavLink>

        <div className="nav-divider" />

        <p className="nav-label">Settings</p>

        <NavLink
          to="/api-keys"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <KeyRound size={18} />
          <span>API Keys</span>
        </NavLink>

        <NavLink
          to="/account"
          className={({ isActive }) =>
            `nav-item ${isActive ? "active" : ""}`
          }
        >
          <Settings size={18} />
          <span>Account</span>
        </NavLink>

        <button
          type="button"
          className="nav-item"
          onClick={handleLogout}
          style={{
            border: "none",
            background: "transparent",
            width: "100%",
            cursor: "pointer",
            font: "inherit",
          }}
        >
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">{initials}</div>

        <div className="user-info">
          <strong>{displayName}</strong>
          <span>{user?.email ?? "Personal workspace"}</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;