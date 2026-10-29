// Server-side account rules. Prices, limits and the template catalog shown to visitors live in catalog.ts
// (and in Dash.PLANS() / Dash.TEMPLATES() for the dashboards).

// Plans, cheapest first. Accounts that never picked one (e.g. "Continue with Google" from the sign-in page) start on Starter.
export const PLANS = ["starter", "business", "pro"] as const;
export type PlanId = (typeof PLANS)[number];
export const DEFAULT_PLAN: PlanId = "starter";
export const isPlan = (v: unknown): v is PlanId => typeof v === "string" && (PLANS as readonly string[]).includes(v);
// The Free plan was retired: accounts still on it are treated as Starter (and saved as such the next time the dashboard saves)
export const currentPlan = (plan: string) => (plan === "free" ? "starter" : plan);
export const billingOf = (v: unknown) => (v === "yearly" ? "yearly" : "monthly");
// Every account is an e-commerce store (the users.category column is kept as "ecommerce")
export const CATEGORY = "ecommerce";
// Starting template when none was picked
export const DEFAULT_TEMPLATE = "luxe-store";
export const SLUG = /^[a-z0-9-]{1,60}$/;
export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const templateOf = (v: unknown, fallback = DEFAULT_TEMPLATE) => (typeof v === "string" && SLUG.test(v) ? v : fallback);
