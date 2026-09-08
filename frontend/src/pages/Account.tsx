import {
  LogOut,
  Mail,
  ShieldCheck,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  clearAuth,
  getStoredUser,
} from "../services/api";

function Account() {
  const navigate = useNavigate();
  const user = getStoredUser();

  function handleLogout() {
    clearAuth();
    navigate("/login", { replace: true });
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Settings</p>
          <h1 className="page-title">Account</h1>
          <p className="page-description">
            Manage your Quill workspace identity and
            session.
          </p>
        </div>
      </section>

      <section className="account-card">
        <div className="account-avatar">
          {user?.email
            ? user.email
                .split("@")[0]
                .slice(0, 2)
                .toUpperCase()
            : "Q"}
        </div>

        <div className="account-main">
          <span className="account-label">
            Email address
          </span>

          <strong>{user?.email ?? "Unknown user"}</strong>

          <p>
            This email is associated with your Quill
            workspace.
          </p>
        </div>
      </section>

      <section className="settings-grid">
        <article className="settings-card">
          <Mail size={19} />
          <div>
            <strong>Account email</strong>
            <span>
              {user?.email ?? "Not available"}
            </span>
          </div>
        </article>

        <article className="settings-card">
          <ShieldCheck size={19} />
          <div>
            <strong>Authentication</strong>
            <span>
              Session authentication is active.
            </span>
          </div>
        </article>
      </section>

      <button
        type="button"
        className="logout-button"
        onClick={handleLogout}
      >
        <LogOut size={16} />
        Sign out of Quill
      </button>
    </main>
  );
}

export default Account;