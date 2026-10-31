// Small helpers shared by platform.ts (kept separate so it doesn't pull in the request helpers)
export const clean = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
