import { Bell, Search, Command } from "lucide-react";

function Topbar() {
  return (
    <header className="topbar">
      <div className="search-box">
        <Search size={17} />

        <input
          type="text"
          placeholder="Search posts..."
          aria-label="Search posts"
        />

        <div className="search-shortcut">
          <Command size={12} />
          <span>K</span>
        </div>
      </div>

      <div className="topbar-actions">
        <button className="icon-button" aria-label="Notifications">
          <Bell size={18} />
        </button>

        <button className="topbar-avatar" aria-label="Account">
          ZA
        </button>
      </div>
    </header>
  );
}

export default Topbar;