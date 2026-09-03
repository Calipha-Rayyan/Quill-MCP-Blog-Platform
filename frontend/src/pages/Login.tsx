import { ArrowRight, LockKeyhole, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">Q</div>
          <span>Quill</span>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">Welcome back</p>

          <h1>Sign in to Quill</h1>

          <p>
            Manage your writing, publish posts, and connect your AI workflow.
          </p>
        </div>

        <form className="auth-form">
          <div className="form-field">
            <label htmlFor="email">Email</label>

            <div className="input-wrapper">
              <Mail size={17} />

              <input
                id="email"
                type="email"
                placeholder="you@example.com"
                autoComplete="email"
              />
            </div>
          </div>

          <div className="form-field">
            <div className="password-label">
              <label htmlFor="password">Password</label>

              <button type="button" className="forgot-button">
                Forgot password?
              </button>
            </div>

            <div className="input-wrapper">
              <LockKeyhole size={17} />

              <input
                id="password"
                type="password"
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-submit">
            Sign in
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account?{" "}
          <button type="button" onClick={() => navigate("/signup")}>
            Create one
          </button>
        </p>
      </section>
    </main>
  );
}

export default Login;