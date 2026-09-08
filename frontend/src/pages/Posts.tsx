import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Check,
  Edit3,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  deletePost,
  getPosts,
  publishPost,
  unpublishPost,
} from "../services/api";

import type { Post } from "../services/api";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
}

function Posts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [posts, setPosts] = useState<Post[]>([]);
  const [search, setSearch] = useState(
    searchParams.get("search") ?? "",
  );

  const [filter, setFilter] =
    useState("all");

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const [deleteTarget, setDeleteTarget] =
    useState<Post | null>(null);

  const [deleting, setDeleting] =
    useState(false);

  async function loadPosts() {
    try {
      setLoading(true);
      setError("");

      setPosts(await getPosts());
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load posts.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    setSearch(
      searchParams.get("search") ?? "",
    );
  }, [searchParams]);

  useEffect(() => {
    void loadPosts();
  }, []);

  useEffect(() => {
    if (!success) return;

    const timer = window.setTimeout(() => {
      setSuccess("");
    }, 3500);

    return () => {
      window.clearTimeout(timer);
    };
  }, [success]);

  const filteredPosts = useMemo(() => {
    const value =
      search.trim().toLowerCase();

    return posts.filter((post) => {
      const matchesSearch =
        !value ||
        post.title
          .toLowerCase()
          .includes(value) ||
        post.slug
          .toLowerCase()
          .includes(value);

      const matchesFilter =
        filter === "all" ||
        post.status === filter;

      return (
        matchesSearch &&
        matchesFilter
      );
    });
  }, [posts, search, filter]);

  async function confirmDelete() {
    if (!deleteTarget) return;

    try {
      setDeleting(true);
      setError("");

      await deletePost(deleteTarget.id);

      setPosts((current) =>
        current.filter(
          (post) =>
            post.id !== deleteTarget.id,
        ),
      );

      setSuccess(
        `"${deleteTarget.title}" was deleted successfully.`,
      );

      setDeleteTarget(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to delete post.",
      );
    } finally {
      setDeleting(false);
    }
  }

  async function handlePublish(
    post: Post,
  ) {
    try {
      setError("");
      setSuccess("");

      const updated =
        post.status === "published"
          ? await unpublishPost(post.id)
          : await publishPost(post.id);

      setPosts((current) =>
        current.map((item) =>
          item.id === updated.id
            ? updated
            : item,
        ),
      );

      setSuccess(
        updated.status === "published"
          ? `"${updated.title}" was published.`
          : `"${updated.title}" was unpublished.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update post.",
      );
    }
  }

  return (
    <>
      <main className="dashboard-page">
        <section className="dashboard-header">
          <div>
            <p className="eyebrow">
              Workspace
            </p>

            <h1 className="page-title">
              Posts
            </h1>

            <p className="page-description">
              Create, edit, publish, and organize
              your writing.
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

        {success && (
          <div className="dashboard-success">
            <Check size={16} />
            <span>{success}</span>

            <button
              type="button"
              onClick={() => setSuccess("")}
              aria-label="Close message"
            >
              <X size={14} />
            </button>
          </div>
        )}

        <section className="posts-toolbar">
          <div className="posts-search">
            <Search size={17} />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search your posts..."
            />

            {search && (
              <button
                type="button"
                className="search-clear"
                onClick={() =>
                  setSearch("")
                }
                aria-label="Clear search"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="posts-filters">
            {[
              "all",
              "draft",
              "published",
              "scheduled",
            ].map((value) => (
              <button
                type="button"
                key={value}
                className={
                  filter === value
                    ? "filter-button active"
                    : "filter-button"
                }
                onClick={() =>
                  setFilter(value)
                }
              >
                {value
                  .charAt(0)
                  .toUpperCase() +
                  value.slice(1)}
              </button>
            ))}
          </div>
        </section>

        <section className="posts-table-card">
          <div className="posts-table-header">
            <span>Post</span>
            <span>Status</span>
            <span>Updated</span>
            <span>Actions</span>
          </div>

          {loading ? (
            <div className="posts-empty">
              <FileText size={28} />
              <strong>
                Loading your posts...
              </strong>
              <span>
                Please wait.
              </span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="posts-empty">
              <FileText size={28} />

              <strong>
                No posts found
              </strong>

              <span>
                Create a post or change your
                search/filter.
              </span>

              <button
                type="button"
                className="primary-button"
                onClick={() =>
                  navigate("/editor")
                }
              >
                <Plus size={16} />
                Create post
              </button>
            </div>
          ) : (
            filteredPosts.map((post) => (
              <article
                className="post-table-row"
                key={post.id}
              >
                <div className="post-table-title">
                  <div className="post-icon">
                    <FileText size={17} />
                  </div>

                  <div>
                    <h3>{post.title}</h3>
                    <p>
                      /{post.slug}
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

                <span className="post-date">
                  {formatDate(
                    post.updated_at,
                  )}
                </span>

                <div className="post-actions">
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

                  {post.status !==
                    "scheduled" && (
                    <button
                      type="button"
                      className="small-action"
                      onClick={() =>
                        handlePublish(post)
                      }
                    >
                      {post.status ===
                      "published"
                        ? "Unpublish"
                        : "Publish"}
                    </button>
                  )}

                  <button
                    type="button"
                    className="danger-action"
                    onClick={() =>
                      setDeleteTarget(post)
                    }
                    aria-label={`Delete ${post.title}`}
                  >
                    <Trash2 size={15} />
                  </button>

                  <MoreHorizontal
                    size={16}
                    className="muted-icon"
                  />
                </div>
              </article>
            ))
          )}
        </section>
      </main>

      {deleteTarget && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setDeleteTarget(null);
            }
          }}
        >
          <div
            className="confirm-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-title"
          >
            <div className="confirm-icon">
              <AlertTriangle size={22} />
            </div>

            <div className="confirm-content">
              <h2 id="delete-title">
                Delete post?
              </h2>

              <p>
                You are about to permanently
                delete:
              </p>

              <strong>
                {deleteTarget.title}
              </strong>

              <span>
                This action cannot be undone.
              </span>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setDeleteTarget(null)
                }
                disabled={deleting}
              >
                Cancel
              </button>

              <button
                type="button"
                className="delete-confirm-button"
                onClick={confirmDelete}
                disabled={deleting}
              >
                <Trash2 size={15} />
                {deleting
                  ? "Deleting..."
                  : "Delete permanently"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Posts;