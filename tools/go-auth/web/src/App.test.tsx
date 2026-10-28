import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, waitFor, fireEvent, act } from "@testing-library/react";
import { App } from "./App";
import { Login } from "./Login";
import { messages } from "./i18n";
import { destination } from "./api";

const member = {
  id: "synthetic-member",
  identity_subject: "synthetic-member",
  email: "synthetic-member@example.invalid",
  display_name: "Synthetic member",
  role: "member",
  status: "active",
};
const admin = { ...member, id: "synthetic-admin", display_name: "Synthetic admin", role: "admin" };
let user: typeof member | null;
let forbidden = false;
let offline = false;
const mocked = vi.fn(async (path: string, init?: RequestInit) => {
  await Promise.resolve();
  if (offline) throw new TypeError("offline");
  if (path.endsWith("/logout")) {
    if (init?.headers && (init.headers as Record<string, string>)["X-CSRF-Token"] === "test-csrf") {
      user = null;
      return new Response(null, { status: 204 });
    }
    return new Response("{}", { status: 403 });
  }
  if (!user) return new Response("{}", { status: 401 });
  if (path.endsWith("/me")) return new Response(JSON.stringify({ user, csrf_token: "test-csrf" }));
  if (path.includes("/admin/") && (user.role !== "admin" || forbidden))
    return new Response("{}", { status: 403 });
  return new Response(JSON.stringify({ message: "ok" }));
});
beforeEach(() => {
  history.replaceState(null, "", "/dashboard");
  user = { ...member };
  offline = false;
  forbidden = false;
  mocked.mockClear();
  vi.stubGlobal("fetch", mocked);
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
describe("authentication shell", () => {
  it("reserves bootstrap layout and signs in through the IdP", async () => {
    user = null;
    render(<App />);
    expect(screen.getByRole("status").textContent).toContain(messages.ja.loading);
    const link = await screen.findByRole("link", { name: new RegExp(messages.ja.continue) });
    expect(link.getAttribute("href")).toContain("/api/v1/auth/login?return_to=%2Fdashboard");
    expect(screen.queryByRole("textbox")).toBeNull();
  });
  it("has a meaningful opening state", () => {
    render(<Login locale="vi" t={messages.vi} message={messages.vi.error} />);
    expect(screen.getByRole("alert").textContent).toBe(messages.vi.error);
    const link = screen.getByRole("link");
    link.addEventListener("click", (e) => {
      e.preventDefault();
    });
    fireEvent.click(link);
    expect(screen.getByRole("link").getAttribute("aria-disabled")).toBe("true");
    expect(screen.getByRole("link").textContent).toContain(messages.vi.opening);
  });
  it("bootstraps member, hides admin navigation and preserves session on refresh", async () => {
    const result = render(<App />);
    await screen.findByText(messages.ja.greeting);
    expect(screen.queryByRole("link", { name: messages.ja.admin })).toBeNull();
    result.unmount();
    render(<App />);
    await screen.findByText(messages.ja.greeting);
    expect(screen.queryByRole("link", { name: new RegExp(messages.ja.continue) })).toBeNull();
  });
  it("admin sees protected management and profile", async () => {
    user = { ...admin };
    render(<App />);
    await screen.findByText(messages.ja.greeting);
    fireEvent.click(screen.getByRole("link", { name: new RegExp(messages.ja.admin) }));
    await screen.findByText(messages.ja.adminDescription);
    expect(mocked.mock.calls.some(([p]) => p === "/api/v1/admin/overview")).toBe(true);
    fireEvent.click(screen.getByRole("link", { name: messages.ja.profile }));
    await screen.findByText(admin.email);
  });
  it("member manually navigating to admin sees denial from API", async () => {
    history.replaceState(null, "", "/admin");
    render(<App />);
    await screen.findByRole("alert");
    expect(screen.getByRole("alert").textContent).toBe(messages.ja.denied);
  });
  it("logout sends CSRF token and clears authenticated shell", async () => {
    render(<App />);
    await screen.findByText(messages.ja.greeting);
    fireEvent.click(screen.getByRole("button", { name: new RegExp(messages.ja.logout) }));
    await screen.findByRole("link", { name: new RegExp(messages.ja.continue) });
    expect(mocked.mock.calls.some(([p, i]) => p.endsWith("/logout") && i?.method === "POST")).toBe(
      true,
    );
  });
  it("expired server session returns to sign in without redirect loop", async () => {
    render(<App />);
    await screen.findByText(messages.ja.greeting);
    user = null;
    fireEvent.click(screen.getByRole("link", { name: messages.ja.profile }));
    await screen.findByRole("link", { name: new RegExp(messages.ja.continue) });
    expect(screen.getByRole("alert").textContent).toBe(messages.ja.expired);
    expect(mocked.mock.calls.length).toBeLessThan(10);
  });
  it("supports Vietnamese and safe authentication error", async () => {
    history.replaceState(null, "", "/login?lang=vi&error=authentication_failed");
    user = null;
    render(<App />);
    await screen.findByRole("link", { name: new RegExp(messages.vi.continue) });
    expect(screen.getByRole("alert").textContent).toBe(messages.vi.error);
    expect(document.documentElement.lang).toBe("vi");
    fireEvent.change(screen.getByRole("combobox"), { target: { value: "ja" } });
    await waitFor(() => {
      expect(document.documentElement.lang).toBe("ja");
    });
  });
  it("network failure offers retry", async () => {
    offline = true;
    render(<App />);
    await screen.findByRole("button", { name: messages.ja.retry });
    offline = false;
    fireEvent.click(screen.getByRole("button", { name: messages.ja.retry }));
    await screen.findByText(messages.ja.greeting);
  });
  it("a response in flight cannot restore the shell after logout", async () => {
    let release: ((response: Response) => void) | undefined;
    vi.stubGlobal("fetch", (path: string, init?: RequestInit) => {
      if (path === "/api/v1/dashboard")
        return new Promise<Response>((resolve) => {
          release = resolve;
        });
      return mocked(path, init);
    });
    render(<App />);
    await screen.findByRole("button", { name: new RegExp(messages.ja.logout) });
    await waitFor(() => {
      expect(release).toBeDefined();
    });
    fireEvent.click(screen.getByRole("button", { name: new RegExp(messages.ja.logout) }));
    await screen.findByRole("link", { name: new RegExp(messages.ja.continue) });
    await act(async () => {
      release?.(new Response("{}"));
      await Promise.resolve();
    });
    expect(screen.queryByRole("button", { name: new RegExp(messages.ja.logout) })).toBeNull();
    expect(screen.getByRole("link", { name: new RegExp(messages.ja.continue) })).toBeTruthy();
  });
  it("rejects external destinations", () => {
    for (const p of ["https://evil.invalid", "//evil.invalid", "/unknown"])
      expect(destination(p)).toBe("/dashboard");
  });
});

it("keeps the authenticated header absent and the single locale control in the sidebar", async () => {
  render(<App />);
  await screen.findByText(messages.ja.greeting);
  expect(document.querySelector("header.brand-header")).toBeNull();
  const picker = screen.getByRole("combobox", { name: "Language / 言語 / Ngôn ngữ" });
  expect(picker.closest("aside")).not.toBeNull();
  expect(screen.getAllByRole("combobox")).toHaveLength(1);
  fireEvent.change(picker, { target: { value: "vi" } });
  expect(screen.queryByRole("link", { name: "Dịch" })).toBeNull();
  expect(document.documentElement.lang).toBe("vi");
});
it("rejects removed translation destinations", () => {
  for (const path of ["/translations", "/translations/sites/site_pc_synthetic/forms/frm_test"])
    expect(destination(path)).toBe("/dashboard");
});
it("redirects an old translation URL without mounting the deleted page", async () => {
  history.replaceState(null, "", "/translations/sites/site_pc_synthetic/forms/frm_test?lang=vi");
  render(<App />);
  await screen.findByText(messages.vi.greeting);
  expect(location.pathname).toBe("/dashboard");
  expect(screen.queryByRole("link", { name: "Dịch" })).toBeNull();
  expect(document.querySelector(".studio-root")).toBeNull();
});
