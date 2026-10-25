// All Vitest test workers inherit this guard. No live credential verification in tests.
globalThis.fetch = () =>
  Promise.reject(new Error("network disabled in tests (S0 security boundary)"));
