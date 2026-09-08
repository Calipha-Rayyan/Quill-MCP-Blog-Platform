import { useEffect, useMemo, useState } from "react";
import {
  CalendarClock,
  Edit3,
  FileText,
  Plus,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getPosts } from "../services/api";
import type { Post } from "../services/api";

function formatScheduledDate(
  value: string | null,
): string {
  if (!value) {
    return "No date";
  }

  return new Date(value).toLocaleString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    },
  );
}

function Scheduled() {
  const navigate = useNavigate();

  const [posts, setPosts] =
    useState<Post[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    async function loadScheduledPosts() {
      try {
        setLoading(true);
        setError("");

        const allPosts = await getPosts();

        setPosts(
          allPosts.filter(
            (post) =>
              post.status === "scheduled",
          ),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load scheduled posts.",
        );
      } finally {
        setLoading(false);
      }
    }

    void loadScheduledPosts();
  }, []);

  const scheduledPosts = useMemo(
    () =>
      [...posts].sort(
        (a, b) =>
          new Date(
            a.scheduled_at ?? "",
          ).getTime() -
          new Date(
            b.scheduled_at ?? "",
          ).getTime(),
      ),
    [posts],
  );

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">
            Publishing
          </p>

          <h1 className="page-title">
            Scheduled
          </h1>

          <p className="page-description">
            Manage posts that are waiting to
            be published.
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

      {loading ? (
        <section className="scheduled-card">
          <div className="posts-empty">
            <CalendarClock size={28} />
            <strong>
              Loading scheduled posts...
            </strong>
          </div>
        </section>
      ) : scheduledPosts.length === 0 ? (
        <section className="scheduled-card">
          <div className="scheduled-empty">
            <div className="scheduled-empty-icon">
              <CalendarClock size={25} />
            </div>

            <h2>
              Nothing scheduled
            </h2>

            <p>
              Posts you schedule will appear
              here with their publishing date
              and time.
            </p>

            <button
              type="button"
              className="primary-button"
              onClick={() =>
                navigate("/editor")
              }
            >
              <Plus size={16} />
              Create a scheduled post
            </button>
          </div>
        </section>
      ) : (
        <section className="scheduled-card">
          <div className="scheduled-header-row">
            <span>Post</span>
            <span>Scheduled for</span>
            <span>Status</span>
            <span>Action</span>
          </div>

          {scheduledPosts.map((post) => (
            <article
              className="scheduled-row"
              key={post.id}
            >
              <div className="scheduled-post">
                <div className="post-icon">
                  <FileText size={17} />
                </div>

                <div>
                  <h3>
                    {post.title}
                  </h3>

                  <p>
                    /{post.slug}
                  </p>
                </div>
              </div>

              <div className="scheduled-date">
                <CalendarClock size={16} />
                <span>
                  {formatScheduledDate(
                    post.scheduled_at,
                  )}
                </span>
              </div>

              <span className="status-badge scheduled">
                Scheduled
              </span>

              <button
                type="button"
                className="small-action"
                onClick={() =>
                  navigate(
                    `/editor/${post.id}`,
                  )
                }
              >
                <Edit3 size={15} />
                Edit
              </button>
            </article>
          ))}
        </section>
      )}
    </main>
  );
}

export default Scheduled;