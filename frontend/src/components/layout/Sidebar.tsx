import {
  LayoutDashboard,
  FileText,
  KeyRound,
  Settings,
  PenLine,
} from "lucide-react";

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">Q</div>
        <span>Quill</span>
      </div>

      <nav className="sidebar-nav">
        <p className="nav-label">Workspace</p>

        <a href="#" className="nav-item active">
          <LayoutDashboard size={18} />
          <span>Overview</span>
        </a>

        <a href="#" className="nav-item">
          <FileText size={18} />
          <span>Posts</span>
        </a>

        <a href="#" className="nav-item">
          <PenLine size={18} />
          <span>Editor</span>
        </a>

        <div className="nav-divider" />

        <p className="nav-label">Settings</p>

        <a href="#" className="nav-item">
          <KeyRound size={18} />
          <span>API Keys</span>
        </a>

        <a href="#" className="nav-item">
          <Settings size={18} />
          <span>Account</span>
        </a>
      </nav>

      <div className="sidebar-footer">
        <div className="user-avatar">ZA</div>

        <div className="user-info">
          <strong>Zain Ali</strong>
          <span>Personal workspace</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;