import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  ArrowLeft,
  CalendarClock,
  Eye,
  Globe,
  Save,
  Send,
  X,
} from "lucide-react";
import {
  createPost,
  getPost,
  publishPost,
  schedulePost,
  updatePost,
} from "../services/api";
import type { Post } from "../services/api";
import {
  useNavigate,
  useParams,
} from "react-router-dom";

function Editor() {
  const navigate = useNavigate();
  const { id } = useParams();

  const editing = Boolean(id);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [metaTitle, setMetaTitle] = useState("");
  const [metaDescription, setMetaDescription] =
    useState("");

  const [loading, setLoading] =
    useState(editing);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState("");

  const [savedMessage, setSavedMessage] =
    useState("");

  const [scheduleOpen, setScheduleOpen] =
    useState(false);

  const [scheduleDate, setScheduleDate] =
    useState("");

  const [scheduleTime, setScheduleTime] =
    useState("");

  const [scheduling, setScheduling] =
    useState(false);

  useEffect(() => {
    if (!id) return;

    getPost(id)
      .then((post: Post) => {
        setTitle(post.title);
        setContent(post.content_md);
        setMetaTitle(post.meta_title ?? "");
        setMetaDescription(
          post.meta_description ?? "",
        );
      })
      .catch((err) => {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load post.",
        );
      })
      .finally(() => {
        setLoading(false);
      });
  }, [id]);

  async function saveDraft(
    event?: FormEvent,
  ) {
    event?.preventDefault();

    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSavedMessage("");

      if (id) {
        await updatePost(id, {
          title,
          content_md: content,
          meta_title:
            metaTitle.trim() || null,
          meta_description:
            metaDescription.trim() || null,
        });

        setSavedMessage("Changes saved.");
      } else {
        const post = await createPost(
          title,
          content,
        );

        if (
          metaTitle ||
          metaDescription
        ) {
          await updatePost(post.id, {
            meta_title:
              metaTitle.trim() || null,
            meta_description:
              metaDescription.trim() || null,
          });
        }

        navigate(
          `/editor/${post.id}`,
          { replace: true },
        );

        setSavedMessage(
          "Draft created.",
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to save post.",
      );
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!title.trim()) {
      setError("Please enter a title.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (!id) {
        const post = await createPost(
          title,
          content,
        );

        await updatePost(post.id, {
          meta_title:
            metaTitle.trim() || null,
          meta_description:
            metaDescription.trim() || null,
        });

        await publishPost(post.id);

        navigate("/posts");
        return;
      }

      await updatePost(id, {
        title,
        content_md: content,
        meta_title:
          metaTitle.trim() || null,
        meta_description:
          metaDescription.trim() || null,
      });

      await publishPost(id);

      navigate("/posts");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to publish post.",
      );
    } finally {
      setSaving(false);
    }
  }

  function openScheduleDialog() {
    setError("");

    const now = new Date();

    const year =
      now.getFullYear();

    const month =
      String(now.getMonth() + 1).padStart(
        2,
        "0",
      );

    const day =
      String(now.getDate()).padStart(
        2,
        "0",
      );

    setScheduleDate(
      `${year}-${month}-${day}`,
    );

    setScheduleTime(
      `${String(
        Math.min(
          now.getHours() + 1,
          23,
        ),
      ).padStart(2, "0")}:00`,
    );

    setScheduleOpen(true);
  }

  async function confirmSchedule() {
    if (!id) {
      setError(
        "Save the post first before scheduling it.",
      );

      setScheduleOpen(false);
      return;
    }

    if (!scheduleDate) {
      setError(
        "Please select a publish date.",
      );
      return;
    }

    if (!scheduleTime) {
      setError(
        "Please select a publish time.",
      );
      return;
    }

    const publishAt =
      `${scheduleDate}T${scheduleTime}:00`;

    const selectedDate = new Date(
      publishAt,
    );

    if (
      Number.isNaN(
        selectedDate.getTime(),
      )
    ) {
      setError(
        "Please enter a valid date and time.",
      );
      return;
    }

    if (
      selectedDate.getTime() <=
      Date.now()
    ) {
      setError(
        "Scheduled time must be in the future.",
      );
      return;
    }

    try {
      setScheduling(true);
      setError("");
      setSavedMessage("");

      await updatePost(id, {
        title,
        content_md: content,
        meta_title:
          metaTitle.trim() || null,
        meta_description:
          metaDescription.trim() || null,
      });

      await schedulePost(
        id,
        publishAt,
      );

      setScheduleOpen(false);
      setSavedMessage(
        "Post scheduled successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to schedule post.",
      );
    } finally {
      setScheduling(false);
    }
  }

  if (loading) {
    return (
      <main className="dashboard-page">
        <div className="editor-loading">
          Loading editor...
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="dashboard-page">
        <div className="editor-topbar">
          <button
            type="button"
            className="ghost-button"
            onClick={() =>
              navigate("/posts")
            }
          >
            <ArrowLeft size={16} />
            Back to posts
          </button>

          <div className="editor-actions">
            <button
              type="button"
              className="ghost-button"
              onClick={() =>
                saveDraft()
              }
              disabled={saving}
            >
              <Save size={16} />
              {saving
                ? "Saving..."
                : "Save draft"}
            </button>

            <button
              type="button"
              className="ghost-button"
              onClick={
                openScheduleDialog
              }
              disabled={saving}
            >
              <CalendarClock
                size={16}
              />
              Schedule
            </button>

            <button
              type="button"
              className="primary-button"
              onClick={publish}
              disabled={
                saving ||
                !title.trim()
              }
            >
              <Send size={16} />
              Publish
            </button>
          </div>
        </div>

        {error && (
          <div className="dashboard-error">
            {error}
          </div>
        )}

        {savedMessage && (
          <div className="editor-success">
            {savedMessage}
          </div>
        )}

        <div className="editor-layout">
          <form
            className="editor-main"
            onSubmit={saveDraft}
          >
            <input
              className="editor-title"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              placeholder="Post title..."
              maxLength={180}
            />

            <div className="editor-meta">
              <span>
                {editing
                  ? "Editing existing post"
                  : "New draft"}
              </span>
            </div>

            <textarea
              className="editor-content"
              value={content}
              onChange={(event) =>
                setContent(
                  event.target.value,
                )
              }
              placeholder="Start writing in Markdown..."
            />
          </form>

          <aside className="editor-sidebar">
            <section className="editor-panel">
              <div className="editor-panel-heading">
                <div>
                  <strong>SEO</strong>
                  <span>
                    Search appearance
                  </span>
                </div>

                <Eye size={17} />
              </div>

              <label>
                Meta title

                <input
                  value={metaTitle}
                  onChange={(event) =>
                    setMetaTitle(
                      event.target.value,
                    )
                  }
                  placeholder="SEO title"
                />
              </label>

              <label>
                Meta description

                <textarea
                  value={metaDescription}
                  onChange={(event) =>
                    setMetaDescription(
                      event.target.value,
                    )
                  }
                  placeholder="Describe this post..."
                  rows={5}
                />
              </label>
            </section>

            <section className="editor-panel editor-tip">
              <strong>
                Publishing tip
              </strong>

              <p>
                Save your draft first, then
                publish or schedule it when
                you're ready.
              </p>
            </section>
          </aside>
        </div>
      </main>

      {scheduleOpen && (
        <div
          className="modal-backdrop"
          role="presentation"
          onMouseDown={(event) => {
            if (
              event.target ===
              event.currentTarget
            ) {
              setScheduleOpen(
                false,
              );
            }
          }}
        >
          <div
            className="schedule-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="schedule-title"
          >
            <div className="schedule-modal-header">
              <div>
                <div className="schedule-icon">
                  <CalendarClock
                    size={21}
                  />
                </div>

                <div>
                  <h2 id="schedule-title">
                    Schedule post
                  </h2>

                  <p>
                    Choose when this post
                    should be published.
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="modal-close"
                onClick={() =>
                  setScheduleOpen(
                    false,
                  )
                }
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="schedule-fields">
              <label>
                Publish date

                <input
                  type="date"
                  value={scheduleDate}
                  min={
                    new Date()
                      .toISOString()
                      .split("T")[0]
                  }
                  onChange={(event) =>
                    setScheduleDate(
                      event.target.value,
                    )
                  }
                />
              </label>

              <label>
                Publish time

                <input
                  type="time"
                  value={scheduleTime}
                  onChange={(event) =>
                    setScheduleTime(
                      event.target.value,
                    )
                  }
                />
              </label>
            </div>

            <div className="schedule-preview">
              <Globe size={16} />

              <span>
                {scheduleDate &&
                scheduleTime
                  ? new Date(
                      `${scheduleDate}T${scheduleTime}`,
                    ).toLocaleString(
                      undefined,
                      {
                        dateStyle:
                          "medium",
                        timeStyle:
                          "short",
                      },
                    )
                  : "Select a date and time"}
              </span>
            </div>

            <div className="confirm-actions">
              <button
                type="button"
                className="ghost-button"
                onClick={() =>
                  setScheduleOpen(
                    false,
                  )
                }
                disabled={scheduling}
              >
                Cancel
              </button>

              <button
                type="button"
                className="primary-button"
                onClick={
                  confirmSchedule
                }
                disabled={scheduling}
              >
                <CalendarClock
                  size={15}
                />

                {scheduling
                  ? "Scheduling..."
                  : "Schedule post"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Editor;