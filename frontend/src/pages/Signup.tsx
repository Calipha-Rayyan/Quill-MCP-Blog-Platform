import { ArrowRight, LockKeyhole, Mail, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Signup() {
  const navigate = useNavigate();

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">Q</div>
          <span>Quill</span>
        </div>

        <div className="auth-heading">
          <p className="eyebrow">Get started</p>

          <h1>Create your Quill account</h1>

          <p>
            Start writing, publish your ideas, and manage your blog with ease.
          </p>
        </div>

        <form className="auth-form">
          <div className="form-field">
            <label htmlFor="name">Full name</label>

            <div className="input-wrapper">
              <User size={17} />

              <input
                id="name"
                type="text"
                placeholder="Zain Ali"
                autoComplete="name"
              />
            </div>
          </div>

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
            <label htmlFor="password">Password</label>

            <div className="input-wrapper">
              <LockKeyhole size={17} />

              <input
                id="password"
                type="password"
                placeholder="Create a password"
                autoComplete="new-password"
              />
            </div>
          </div>

          <button type="submit" className="auth-submit">
            Create account
            <ArrowRight size={17} />
          </button>
        </form>

        <p className="auth-switch">
          Already have an account?{" "}
          <button type="button" onClick={() => navigate("/")}>
            Sign in
          </button>
        </p>
      </section>
    </main>
  );
}

export default Signup;