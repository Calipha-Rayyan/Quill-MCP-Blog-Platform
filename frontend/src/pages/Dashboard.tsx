import {
  FileText,
  Eye,
  PenLine,
  ArrowUpRight,
  Plus,
} from "lucide-react";

function Dashboard() {
  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Workspace</p>

          <h1 className="page-title">
            Good morning
          </h1>

          <p className="page-description">
            Manage your blog, publish ideas, and keep everything organized.
          </p>
        </div>

        <button className="primary-button">
          <Plus size={17} />
          New post
        </button>
      </section>

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <FileText size={18} />
          </div>

          <div className="stat-content">
            <span>Total posts</span>
            <strong>12</strong>
          </div>

          <ArrowUpRight size={16} className="stat-arrow" />
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <PenLine size={18} />
          </div>

          <div className="stat-content">
            <span>Drafts</span>
            <strong>4</strong>
          </div>

          <ArrowUpRight size={16} className="stat-arrow" />
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Eye size={18} />
          </div>

          <div className="stat-content">
            <span>Total views</span>
            <strong>1,240</strong>
          </div>

          <ArrowUpRight size={16} className="stat-arrow" />
        </article>
      </section>

      <section className="recent-section">
        <div className="section-heading">
          <div>
            <h2>Recent posts</h2>
            <p>Your latest writing activity.</p>
          </div>

          <button className="ghost-button">
            View all
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="posts-card">
          <article className="post-row">
            <div className="post-info">
              <div className="post-icon">
                <FileText size={17} />
              </div>

              <div>
                <h3>My First AI Project</h3>
                <p>Updated a few minutes ago</p>
              </div>
            </div>

            <span className="status-badge draft">
              Draft
            </span>
          </article>

          <article className="post-row">
            <div className="post-info">
              <div className="post-icon">
                <FileText size={17} />
              </div>

              <div>
                <h3>Understanding MCP</h3>
                <p>Published yesterday</p>
              </div>
            </div>

            <span className="status-badge published">
              Published
            </span>
          </article>

          <article className="post-row">
            <div className="post-info">
              <div className="post-icon">
                <FileText size={17} />
              </div>

              <div>
                <h3>Building with Claude Code</h3>
                <p>Published 3 days ago</p>
              </div>
            </div>

            <span className="status-badge published">
              Published
            </span>
          </article>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;