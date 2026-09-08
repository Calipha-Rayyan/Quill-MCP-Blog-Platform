const API_BASE = "/api";

const TOKEN_KEY = "quill_token";
const USER_KEY = "quill_user";

export interface User {
  id: string;
  email: string;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  slug: string;
  content_md: string;
  status: "draft" | "published" | "scheduled";
  meta_title: string | null;
  meta_description: string | null;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsItem {
  post_id: string;
  event_count: number;
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function getStoredUser(): User | null {
  const value = localStorage.getItem(USER_KEY);

  if (!value) {
    return null;
  }

  try {
    return JSON.parse(value) as User;
  } catch {
    return null;
  }
}

export function setAuth(token: string, user: User): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();

  const headers = new Headers(options.headers);

  if (options.body) {
    headers.set("Content-Type", "application/json");
  }

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(data?.error ?? "Request failed");
  }

  return data as T;
}

export async function login(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const data = await request<{
    token: string;
    user: User;
  }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuth(data.token, data.user);

  return data;
}

export async function signup(
  email: string,
  password: string,
): Promise<{ token: string; user: User }> {
  const data = await request<{
    token: string;
    user: User;
  }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  setAuth(data.token, data.user);

  return data;
}

export async function getPosts(): Promise<Post[]> {
  const data = await request<{ posts: Post[] }>("/posts");
  return data.posts;
}

export async function getAnalytics(): Promise<AnalyticsItem[]> {
  const data = await request<{ analytics: AnalyticsItem[] }>(
    "/analytics",
  );

  return data.analytics;
}

export function logout(): void {
  clearAuth();
}

export async function createPost(
  title: string,
  content_md: string,
): Promise<Post> {
  const data = await request<{ post: Post }>("/posts", {
    method: "POST",
    body: JSON.stringify({
      title,
      content_md,
    }),
  });

  return data.post;
}

export async function getPost(id: string): Promise<Post> {
  const data = await request<{ post: Post }>(
    `/posts/${id}`,
  );

  return data.post;
}

export async function updatePost(
  id: string,
  payload: {
    title?: string;
    slug?: string;
    content_md?: string;
    meta_title?: string | null;
    meta_description?: string | null;
  },
): Promise<Post> {
  const data = await request<{ post: Post }>(
    `/posts/${id}`,
    {
      method: "PATCH",
      body: JSON.stringify(payload),
    },
  );

  return data.post;
}

export async function deletePost(id: string): Promise<void> {
  await request<void>(`/posts/${id}`, {
    method: "DELETE",
  });
}

export async function publishPost(id: string): Promise<Post> {
  const data = await request<{ post: Post }>(
    `/posts/${id}/publish`,
    {
      method: "POST",
    },
  );

  return data.post;
}

export async function unpublishPost(
  id: string,
): Promise<Post> {
  const data = await request<{ post: Post }>(
    `/posts/${id}/unpublish`,
    {
      method: "POST",
    },
  );

  return data.post;
}

export async function schedulePost(
  id: string,
  publish_at: string,
): Promise<Post> {
  const data = await request<{ post: Post }>(
    `/posts/${id}/schedule`,
    {
      method: "POST",
      body: JSON.stringify({ publish_at }),
    },
  );

  return data.post;
}