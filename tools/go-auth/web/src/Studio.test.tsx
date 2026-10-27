import { act, cleanup, fireEvent, render, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { Studio, type Bridge, type StudioController } from "./Studio";
const fixture = vi.hoisted(() => ({ mount: vi.fn() }));
vi.mock("./studio-bundle", () => ({
  loadStudioBundle: () => Promise.resolve({ mount: fixture.mount }),
}));
const controller = (): { current: StudioController } => ({
  current: {
    dirty: () => false,
    beforeLeave: () => Promise.resolve(true),
    recover: () => undefined,
    navigate: () => Promise.resolve(),
  },
});
beforeEach(() => {
  fixture.mount.mockReset();
  vi.stubGlobal("CSS", { escape: (value: string) => value });
  vi.stubGlobal(
    "fetch",
    vi.fn(() =>
      Promise.resolve(
        new Response(
          '<div id="fixture">Editor</div>',
        ),
      ),
    ),
  );
});
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
it("mounts the editor in the React subtree, synchronizes locale and routes", async () => {
  let bridge: Bridge | undefined;
  const navigate = vi.fn(() => Promise.resolve());
  fixture.mount.mockImplementation((b: Bridge) => {
    bridge = b;
    b.register({
      dirty: () => true,
      beforeLeave: () => Promise.resolve(false),
      recover: () => undefined,
      navigate,
    });
  });
  const ref = controller();
  const result = render(
    <Studio locale="ja" path="/studio" controller={ref} onExpired={() => undefined} />,
  );
  await waitFor(() => {
    expect(fixture.mount).toHaveBeenCalledOnce();
  });
  expect(result.container.querySelector("iframe")).toBeNull();
  expect(result.container.querySelector(".studio-root #fixture")).not.toBeNull();
  expect(ref.current.dirty()).toBe(true);
  result.rerender(
    <Studio
      locale="vi"
      path="/studio/sites/site_pc_synthetic/forms/frm_test"
      controller={ref}
      onExpired={() => undefined}
    />,
  );
  await waitFor(() => {
    expect(navigate).toHaveBeenCalledWith("/studio/sites/site_pc_synthetic/forms/frm_test");
  });
  expect(bridge?.locale).toBe("vi");
});
it("cleans up global listeners and timers and blocks cross-origin editor fetches", async () => {
  const listener = vi.fn();
  const tick = vi.fn();
  let bridge: Bridge | undefined;
  fixture.mount.mockImplementation((b: Bridge) => {
    bridge = b;
    b.window.addEventListener("master:test", listener);
    b.window.setInterval(tick, 10);
  });
  const result = render(
    <Studio locale="ja" path="/studio" controller={controller()} onExpired={() => undefined} />,
  );
  await waitFor(() => {
    expect(fixture.mount).toHaveBeenCalledOnce();
  });
  fireEvent(window, new Event("master:test"));
  expect(listener).toHaveBeenCalledOnce();
  await expect(bridge?.fetch("https://untrusted.invalid/api/get")).rejects.toThrow(
    "E-STUDIO-NETWORK",
  );
  result.unmount();
  fireEvent(window, new Event("master:test"));
  expect(listener).toHaveBeenCalledOnce();
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 25));
  });
  const count = tick.mock.calls.length;
  await new Promise((resolve) => setTimeout(resolve, 25));
  expect(tick.mock.calls.length).toBe(count);
});
it("isolates late editor continuations after unmount", async () => {
  let bridge: Bridge | undefined;
  fixture.mount.mockImplementation((value: Bridge) => {
    bridge = value;
  });
  const result = render(
    <Studio locale="ja" path="/studio" controller={controller()} onExpired={() => undefined} />,
  );
  await waitFor(() => {
    expect(fixture.mount).toHaveBeenCalledOnce();
  });
  result.unmount();
  expect(() => {
    const node = bridge?.document.getElementById("fixture");
    if (node) node.textContent = "late detached update";
    else throw Error("detached editor nodes lost");
  }).not.toThrow();
  const callback = vi.fn();
  expect(bridge?.window.setTimeout(callback, 0)).toBe(0);
  await new Promise((resolve) => setTimeout(resolve, 10));
  expect(callback).not.toHaveBeenCalled();
});
