import { expect, test } from "vitest";
test("fetch cannot reach even a local TCP endpoint", async () => {
  await expect(fetch("http://127.0.0.1:9")).rejects.toThrow("network disabled");
});
