// Shared by the runtime and Form Studio so both offer exactly the same approved assets.
/** Approved image registry: fixed vector drawings, rendered as inline SVG. No URL, file or upload. */
export const APPROVED_IMAGES = {
  success: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z", "M7 12.5l3.2 3.2L17 9"],
  info: ["M12 2a10 10 0 1 0 0 20a10 10 0 1 0 0-20z", "M12 11v6", "M12 7.2v.1"],
  box: ["M3 7.5L12 3l9 4.5v9L12 21l-9-4.5z", "M3 7.5l9 4.5l9-4.5", "M12 12v9"],
  mail: ["M3 6h18v12H3z", "M3 6l9 7l9-7"],
} as const;
/** Approved CTA destinations (synthetic placeholders). Studio offers only these ids. */
export const APPROVED_LINKS = {
  home: "https://example.com/",
  faq: "https://example.com/faq",
  contact: "https://example.com/contact",
} as const;
