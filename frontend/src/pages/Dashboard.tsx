import {
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  FileText,
  Eye,
  PenLine,
  ArrowUpRight,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  getAnalytics,
  getPosts,
} from "../services/api";
import type {
  Post,
} from "../services/api";

function formatRelativeTime(
  dateString: string,
): string {
  const date = new Date(dateString);
  const now = new Date();

  const diffMs =
    now.getTime() - date.getTime();

  const diffMinutes = Math.floor(
    diffMs / 60000,
  );

  const diffHours = Math.floor(
    diffMs / 3600000,
  );

  const diffDays = Math.floor(
    diffMs / 86400000,
  );

  if (diffMinutes < 1) {
    return "Just now";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}m ago`;
  }

  if (diffHours < 24) {
    return `${diffHours}h ago`;
  }

  if (diffDays === 1) {
    return "Yesterday";
  }

  if (diffDays < 7) {
    return `${diffDays} days ago`;
  }

  return date.toLocaleDateString();
}

function getGreeting(): string {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [totalViews, setTotalViews] =
    useState(0);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [
          postsData,
          analyticsData,
        ] = await Promise.all([
          getPosts(),
          getAnalytics(),
        ]);

        setPosts(postsData);

        setTotalViews(
          analyticsData.reduce(
            (total, item) =>
              total + item.event_count,
            0,
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Failed to load dashboard",
        );
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, []);

  const drafts = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "draft",
      ).length,
    [posts],
  );

  const scheduled = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "scheduled",
      ).length,
    [posts],
  );

  const published = useMemo(
    () =>
      posts.filter(
        (post) =>
          post.status === "published",
      ).length,
    [posts],
  );

  const recentPosts = useMemo(
    () =>
      [...posts]
        .sort(
          (a, b) =>
            new Date(
              b.updated_at,
            ).getTime() -
            new Date(
              a.updated_at,
            ).getTime(),
        )
        .slice(0, 5),
    [posts],
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            Workspace
          </p>

          <h1 className="page-title">
            {getGreeting()}
          </h1>

          <p className="page-description">
            Manage your blog, publish ideas,
            and keep everything organized.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={() =>
            navigate("/editor")
          }
        >
          <Plus size={17} />
          New post
        </button>
      </section>

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      <section className="stats-grid">
        <article className="stat-card">
          <div className="stat-icon">
            <FileText size={18} />
          </div>

          <div className="stat-content">
            <span>Total posts</span>

            <strong>
              {loading
                ? "..."
                : posts.length}
            </strong>
          </div>

          <ArrowUpRight
            size={16}
            className="stat-arrow"
          />
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <PenLine size={18} />
          </div>

          <div className="stat-content">
            <span>Drafts</span>

            <strong>
              {loading
                ? "..."
                : drafts}
            </strong>
          </div>

          <ArrowUpRight
            size={16}
            className="stat-arrow"
          />
        </article>

        <article className="stat-card">
          <div className="stat-icon">
            <Eye size={18} />
          </div>

          <div className="stat-content">
            <span>Total views</span>

            <strong>
              {loading
                ? "..."
                : totalViews.toLocaleString()}
            </strong>
          </div>

          <ArrowUpRight
            size={16}
            className="stat-arrow"
          />
        </article>
      </section>

      <section className="recent-section">
        <div className="section-heading">
          <div>
            <h2>Recent posts</h2>

            <p>
              Your latest writing activity.
            </p>
          </div>

          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              navigate("/posts")
            }
          >
            View all
            <ArrowUpRight size={15} />
          </button>
        </div>

        <div className="posts-card">
          {loading ? (
            <div className="post-row">
              <div className="post-info">
                <div className="post-icon">
                  <FileText size={17} />
                </div>

                <div>
                  <h3>
                    Loading posts...
                  </h3>

                  <p>
                    Please wait
                  </p>
                </div>
              </div>
            </div>
          ) : recentPosts.length === 0 ? (
            <div className="post-row">
              <div className="post-info">
                <div className="post-icon">
                  <FileText size={17} />
                </div>

                <div>
                  <h3>
                    No posts yet
                  </h3>

                  <p>
                    Create your first post.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            recentPosts.map((post) => (
              <article
                className="post-row"
                key={post.id}
              >
                <div className="post-info">
                  <div className="post-icon">
                    <FileText size={17} />
                  </div>

                  <div>
                    <h3>
                      {post.title}
                    </h3>

                    <p>
                      Updated{" "}
                      {formatRelativeTime(
                        post.updated_at,
                      )}
                    </p>
                  </div>
                </div>

                <span
                  className={`status-badge ${post.status}`}
                >
                  {post.status
                    .charAt(0)
                    .toUpperCase() +
                    post.status.slice(1)}
                </span>
              </article>
            ))
          )}
        </div>
      </section>

      <section className="dashboard-summary">
        <div>
          <span>Published</span>
          <strong>
            {loading ? "..." : published}
          </strong>
        </div>

        <div>
          <span>Drafts</span>
          <strong>
            {loading ? "..." : drafts}
          </strong>
        </div>

        <div>
          <span>Scheduled</span>
          <strong>
            {loading ? "..." : scheduled}
          </strong>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;