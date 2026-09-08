import {
  useEffect,
  useRef,
  useState,
} from "react";
import {
  Bell,
  Search,
  X,
} from "lucide-react";
import {
  useNavigate,
  useSearchParams,
} from "react-router-dom";
import {
  getPosts,
  getStoredUser,
} from "../../services/api";
import type {
  FormEvent,
} from "react";
import type {
  Post,
} from "../../services/api";

function getInitials(email: string): string {
  const name = email
    .split("@")[0]
    .replace(/[._-]+/g, " ");

  const parts = name
    .split(" ")
    .filter(Boolean);

  if (parts.length === 0) {
    return "Q";
  }

  if (parts.length === 1) {
    return parts[0]
      .slice(0, 2)
      .toUpperCase();
  }

  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
}

function Topbar() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [query, setQuery] = useState(
    searchParams.get("search") ?? "",
  );

  const [notificationsOpen, setNotificationsOpen] =
    useState(false);

  const [recentPosts, setRecentPosts] =
    useState<Post[]>([]);

  const notificationRef =
    useRef<HTMLDivElement>(null);

  const user = getStoredUser();

  const initials = user
    ? getInitials(user.email)
    : "Q";

  useEffect(() => {
    getPosts()
      .then((posts) => {
        setRecentPosts(posts.slice(0, 3));
      })
      .catch(() => {
        setRecentPosts([]);
      });
  }, []);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        notificationRef.current &&
        !notificationRef.current.contains(
          event.target as Node,
        )
      ) {
        setNotificationsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleOutsideClick,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleOutsideClick,
      );
    };
  }, []);

  function handleSearchSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const value = query.trim();

    navigate(
      value
        ? `/posts?search=${encodeURIComponent(value)}`
        : "/posts",
    );
  }

  function clearSearch() {
    setQuery("");
    navigate("/posts");
  }

  return (
    <header className="topbar">
      <form
        className="search-box"
        onSubmit={handleSearchSubmit}
      >
        <Search size={17} />

        <input
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          placeholder="Search posts..."
          aria-label="Search posts"
        />

        {query ? (
          <button
            type="button"
            className="search-clear"
            onClick={clearSearch}
            aria-label="Clear search"
          >
            <X size={14} />
          </button>
        ) : (
          <kbd>Ctrl K</kbd>
        )}
      </form>

      <div className="topbar-actions">
        <div
          className="notification-wrapper"
          ref={notificationRef}
        >
          <button
            type="button"
            className="icon-button"
            aria-label="Notifications"
            onClick={() =>
              setNotificationsOpen(
                (current) => !current,
              )
            }
          >
            <Bell size={18} />

            {recentPosts.length > 0 && (
              <span className="notification-dot" />
            )}
          </button>

          {notificationsOpen && (
            <div className="notification-panel">
              <div className="notification-header">
                <div>
                  <strong>
                    Notifications
                  </strong>

                  <span>
                    Recent workspace activity
                  </span>
                </div>
              </div>

              {recentPosts.length === 0 ? (
                <div className="notification-empty">
                  You're all caught up.
                </div>
              ) : (
                recentPosts.map((post) => (
                  <button
                    type="button"
                    className="notification-item"
                    key={post.id}
                    onClick={() => {
                      setNotificationsOpen(
                        false,
                      );

                      navigate(
                        `/editor/${post.id}`,
                      );
                    }}
                  >
                    <span className="notification-title">
                      {post.title}
                    </span>

                    <span className="notification-meta">
                      {post.status ===
                      "published"
                        ? "Published post"
                        : `${
                            post.status
                              .charAt(0)
                              .toUpperCase() +
                            post.status.slice(1)
                          } post`}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        <button
          type="button"
          className="topbar-avatar"
          onClick={() =>
            navigate("/account")
          }
          aria-label="Open account"
        >
          {initials}
        </button>
      </div>
    </header>
  );
}

export default Topbar;