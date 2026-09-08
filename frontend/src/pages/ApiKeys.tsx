import { useEffect, useState } from "react";
import {
  Check,
  Copy,
  KeyRound,
  Plus,
  RefreshCw,
  Trash2,
} from "lucide-react";

interface ApiKey {
  id: string;
  key?: string;
  created_at?: string;
  revoked_at?: string | null;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = localStorage.getItem("quill_token");

  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");

  if (token) {
    headers.set(
      "Authorization",
      `Bearer ${token}`,
    );
  }

  const response = await fetch(`/api${path}`, {
    ...options,
    headers,
  });

  const data = await response
    .json()
    .catch(() => null);

  if (!response.ok) {
    throw new Error(
      data?.error ?? "Request failed",
    );
  }

  return data as T;
}

function extractKeys(data: unknown): ApiKey[] {
  if (Array.isArray(data)) {
    return data as ApiKey[];
  }

  if (
    data &&
    typeof data === "object" &&
    "keys" in data &&
    Array.isArray(
      (data as { keys?: unknown }).keys,
    )
  ) {
    return (data as { keys: ApiKey[] }).keys;
  }

  if (
    data &&
    typeof data === "object" &&
    "api_keys" in data &&
    Array.isArray(
      (data as { api_keys?: unknown }).api_keys,
    )
  ) {
    return (
      data as { api_keys: ApiKey[] }
    ).api_keys;
  }

  return [];
}

function ApiKeys() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [newKey, setNewKey] = useState("");
  const [loading, setLoading] =
    useState(true);
  const [creating, setCreating] =
    useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] =
    useState("");

  async function loadKeys() {
    try {
      setLoading(true);
      setError("");

      const data = await request<unknown>(
        "/account/api-keys",
      );

      setKeys(extractKeys(data));
    } catch (err) {
      setKeys([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load API keys.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadKeys();
  }, []);

  async function createKey() {
    try {
      setCreating(true);
      setError("");
      setMessage("");
      setNewKey("");

      const data = await request<{
        id: string;
        key: string;
      }>("/account/api-keys", {
        method: "POST",
      });

      setNewKey(data.key);

      await loadKeys();

      setMessage(
        "API key created successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to create API key.",
      );
    } finally {
      setCreating(false);
    }
  }

  async function revokeKey(id: string) {
    const confirmed = window.confirm(
      "Revoke this API key? MCP clients using it will stop working.",
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setMessage("");

      await request<void>(
        `/account/api-keys/${id}`,
        {
          method: "DELETE",
        },
      );

      await loadKeys();

      setMessage(
        "API key revoked successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to revoke API key.",
      );
    }
  }

  async function rotateKey(id: string) {
    try {
      setError("");
      setMessage("");
      setNewKey("");

      const data = await request<{
        id: string;
        key: string;
      }>(
        `/account/api-keys/${id}/rotate`,
        {
          method: "POST",
        },
      );

      setNewKey(data.key);

      await loadKeys();

      setMessage(
        "API key rotated successfully.",
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to rotate API key.",
      );
    }
  }

  async function copyKey() {
    if (!newKey) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        newKey,
      );

      setMessage(
        "API key copied to clipboard.",
      );
    } catch {
      setError(
        "Unable to copy the API key automatically.",
      );
    }
  }

  return (
    <main className="dashboard-page">
      <section className="dashboard-header">
        <div>
          <p className="eyebrow">Settings</p>

          <h1 className="page-title">
            API Keys
          </h1>

          <p className="page-description">
            Manage the keys your MCP clients use
            to access Quill.
          </p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={createKey}
          disabled={creating}
        >
          <Plus size={17} />

          {creating
            ? "Creating..."
            : "Create key"}
        </button>
      </section>

      {newKey && (
        <section className="secret-key-card">
          <div>
            <div className="secret-key-title">
              <Check size={17} />
              New API key created
            </div>

            <p>
              Copy this key now. It may not be
              shown again.
            </p>
          </div>

          <div className="secret-key-value">
            <code>{newKey}</code>

            <button
              type="button"
              onClick={copyKey}
              aria-label="Copy API key"
            >
              <Copy size={16} />
            </button>
          </div>
        </section>
      )}

      {error && (
        <div className="dashboard-error">
          {error}
        </div>
      )}

      {message && !error && (
        <div className="editor-success">
          {message}
        </div>
      )}

      <section className="key-list-card">
        {loading ? (
          <div className="posts-empty">
            <KeyRound size={28} />
            <strong>
              Loading API keys...
            </strong>
            <span>
              Please wait.
            </span>
          </div>
        ) : keys.length === 0 ? (
          <div className="posts-empty">
            <KeyRound size={28} />

            <strong>
              No API keys yet
            </strong>

            <span>
              Create a key to connect Claude,
              Cursor, or another MCP client.
            </span>

            <button
              type="button"
              className="primary-button"
              onClick={createKey}
              disabled={creating}
            >
              <Plus size={16} />
              Create your first key
            </button>
          </div>
        ) : (
          keys.map((key) => (
            <div
              className="api-key-row"
              key={key.id}
            >
              <div className="api-key-icon">
                <KeyRound size={18} />
              </div>

              <div className="api-key-info">
                <strong>
                  Quill MCP Key
                </strong>

                <span>
                  {key.revoked_at
                    ? "Revoked"
                    : "Active"}{" "}
                  · Created{" "}
                  {key.created_at
                    ? new Date(
                        key.created_at,
                      ).toLocaleDateString()
                    : "recently"}
                </span>
              </div>

              {!key.revoked_at && (
                <div className="api-key-actions">
                  <button
                    type="button"
                    className="small-action"
                    onClick={() =>
                      rotateKey(key.id)
                    }
                  >
                    <RefreshCw size={14} />
                    Rotate
                  </button>

                  <button
                    type="button"
                    className="danger-action"
                    onClick={() =>
                      revokeKey(key.id)
                    }
                  >
                    <Trash2 size={14} />
                    Revoke
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </section>
    </main>
  );
}

export default ApiKeys;