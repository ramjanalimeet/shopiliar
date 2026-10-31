// A template's design from the master dashboard's builder: the website settings and the pages with their sections
export const TEMPLATE_ID = /^[a-z0-9-]{1,60}$/;
export const MAX_DESIGN_BYTES = 900_000;

export type Design = { site: Record<string, unknown>; pages: Record<string, unknown>[] };

// Only the parts a design is made of, and only when they have the right shape
export const designOf = (raw: unknown): Design | null => {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  if (!b.site || typeof b.site !== "object" || Array.isArray(b.site)) return null;
  if (!Array.isArray(b.pages) || !b.pages.length || b.pages.length > 60) return null;
  if (!b.pages.every((p) => p && typeof p === "object" && Array.isArray((p as Record<string, unknown>).sections))) return null;
  return { site: b.site as Record<string, unknown>, pages: b.pages as Record<string, unknown>[] };
};
