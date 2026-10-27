export interface User {
  id: string;
  identity_subject: string;
  email: string;
  display_name: string;
  role: "admin" | "member";
  status: "active" | "disabled";
}
export interface Session {
  user: User;
  csrf_token: string;
}
export class ApiError extends Error {
  constructor(public status: number) {
    super("Request failed");
  }
}
export async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    credentials: "same-origin",
    cache: "no-store",
    signal: init?.signal
      ? AbortSignal.any([init.signal, AbortSignal.timeout(10000)])
      : AbortSignal.timeout(10000),
  });
  if (!response.ok) throw new ApiError(response.status);
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
export function destination(path: string): string {
  return ["/dashboard", "/profile", "/settings/profile", "/admin", "/studio"].includes(path) ||
    /^\/studio\/sites\/site_[a-z0-9_]+\/forms\/frm_[a-z0-9_]+$/.test(path)
    ? path
    : "/dashboard";
}
