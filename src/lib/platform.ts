// Shopilier's own settings, changed from the master dashboard (Settings): the public contact details and
// social links, the sign-up and maintenance switches, the admin team and how customers pay Shopilier.
// Kept in D1 (the platform table, created on first use) so every page and API sees the same values.
import { clean, EMAIL } from "./platform-clean";

export type Staff = { id: string; name: string; email: string; role: "owner" | "admin" | "support" | "finance" };
export type PayMethod = { on: boolean; number: string; type: "personal" | "merchant" | "agent" };
export type Settings = {
  company: string; supportEmail: string; supportPhone: string; whatsapp: string; address: string;
  social: { facebook: string; youtube: string; tiktok: string; instagram: string };
  signups: boolean; maintenance: boolean; maintenanceText: string;
  staff: Staff[];
  payments: { bkash: PayMethod; nagad: PayMethod; rocket: PayMethod; bank: { on: boolean; details: string }; invoicePrefix: string; note: string };
};

export const DEFAULTS: Settings = {
  company: "Shopilier", supportEmail: "support@shopilier.com", supportPhone: "", whatsapp: "", address: "Dhaka, Bangladesh",
  social: { facebook: "https://www.facebook.com/shopilier/", youtube: "https://www.youtube.com/@shopilier", tiktok: "https://www.tiktok.com/@shopiliarr", instagram: "" },
  signups: true, maintenance: false, maintenanceText: "Shopilier is getting an update. Some things may be slow for a little while.",
  staff: [],
  payments: {
    bkash: { on: false, number: "", type: "merchant" }, nagad: { on: false, number: "", type: "merchant" }, rocket: { on: false, number: "", type: "personal" },
    bank: { on: false, details: "" }, invoicePrefix: "INV-", note: "",
  },
};

let ready = false;
const ensure = async (env: CloudflareEnv) => {
  if (ready) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS platform (key TEXT PRIMARY KEY, data TEXT NOT NULL, updated_at TEXT NOT NULL)").run();
  ready = true;
};

const url = (v: unknown) => { const s = clean(v, 300); return /^https:\/\/[^\s"'<>]+$/i.test(s) ? s : ""; };
const phone = (v: unknown) => clean(v, 30).replace(/[^\d+\-\s]/g, "");
const bool = (v: unknown, d: boolean) => (typeof v === "boolean" ? v : d);
const method = (v: unknown, d: PayMethod): PayMethod => {
  const m = (v && typeof v === "object" ? v : {}) as Record<string, unknown>;
  return { on: bool(m.on, d.on), number: phone(m.number ?? d.number), type: m.type === "personal" || m.type === "agent" || m.type === "merchant" ? m.type : d.type };
};

// Any input (saved data or a request body) becomes a complete, safe Settings object
export const sanitize = (raw: unknown, base: Settings = DEFAULTS): Settings => {
  const b = (raw && typeof raw === "object" ? raw : {}) as Record<string, any>;
  const s = (b.social && typeof b.social === "object" ? b.social : {}) as Record<string, unknown>;
  const p = (b.payments && typeof b.payments === "object" ? b.payments : {}) as Record<string, any>;
  const email = clean(b.supportEmail ?? base.supportEmail, 254).toLowerCase();
  const staff = (Array.isArray(b.staff) ? b.staff : base.staff).slice(0, 50).map((x: any) => ({
    id: clean(x?.id, 40) || crypto.randomUUID(), name: clean(x?.name, 80), email: clean(x?.email, 254).toLowerCase(),
    role: (["owner", "admin", "support", "finance"].includes(x?.role) ? x.role : "support") as Staff["role"],
  })).filter((x: Staff) => x.name && EMAIL.test(x.email));
  return {
    company: clean(b.company ?? base.company, 80) || "Shopilier",
    supportEmail: EMAIL.test(email) ? email : base.supportEmail,
    supportPhone: phone(b.supportPhone ?? base.supportPhone), whatsapp: phone(b.whatsapp ?? base.whatsapp), address: clean(b.address ?? base.address, 200),
    social: {
      facebook: "facebook" in s ? url(s.facebook) : base.social.facebook, youtube: "youtube" in s ? url(s.youtube) : base.social.youtube,
      tiktok: "tiktok" in s ? url(s.tiktok) : base.social.tiktok, instagram: "instagram" in s ? url(s.instagram) : base.social.instagram,
    },
    signups: bool(b.signups, base.signups), maintenance: bool(b.maintenance, base.maintenance), maintenanceText: clean(b.maintenanceText ?? base.maintenanceText, 200) || DEFAULTS.maintenanceText,
    staff,
    payments: {
      bkash: method(p.bkash, base.payments.bkash), nagad: method(p.nagad, base.payments.nagad), rocket: method(p.rocket, base.payments.rocket),
      bank: { on: bool(p.bank?.on, base.payments.bank.on), details: clean(p.bank?.details ?? base.payments.bank.details, 500) },
      invoicePrefix: clean(p.invoicePrefix ?? base.payments.invoicePrefix, 10).replace(/[^A-Za-z0-9-]/g, "") || "INV-",
      note: clean(p.note ?? base.payments.note, 300),
    },
  };
};

export async function getSettings(env: CloudflareEnv): Promise<Settings> {
  await ensure(env);
  const row = await env.DB.prepare("SELECT data FROM platform WHERE key = 'settings'").first<{ data: string }>();
  if (!row) return DEFAULTS;
  try { return sanitize(JSON.parse(row.data)); } catch { return DEFAULTS; }
}
export async function saveSettings(env: CloudflareEnv, input: unknown): Promise<Settings> {
  const next = sanitize(input, await getSettings(env));
  await env.DB.prepare("INSERT INTO platform (key, data, updated_at) VALUES ('settings', ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind(JSON.stringify(next), new Date().toISOString()).run();
  return next;
}
// What the public website and store dashboards may see (no staff or payment details)
export const publicSettings = (s: Settings) => ({
  company: s.company, supportEmail: s.supportEmail, supportPhone: s.supportPhone, whatsapp: s.whatsapp, address: s.address, social: s.social,
  signups: s.signups, maintenance: s.maintenance, maintenanceText: s.maintenanceText,
});

// Template designs made in the master dashboard's template builder (key "design:<template id>")
export async function getDesign(env: CloudflareEnv, id: string): Promise<unknown | null> {
  await ensure(env);
  const row = await env.DB.prepare("SELECT data FROM platform WHERE key = ?").bind("design:" + id).first<{ data: string }>();
  try { return row ? JSON.parse(row.data) : null; } catch { return null; }
}
export async function saveDesign(env: CloudflareEnv, id: string, design: unknown) {
  await ensure(env);
  await env.DB.prepare("INSERT INTO platform (key, data, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind("design:" + id, JSON.stringify(design), new Date().toISOString()).run();
}
export async function deleteDesign(env: CloudflareEnv, id: string) {
  await ensure(env);
  await env.DB.prepare("DELETE FROM platform WHERE key = ?").bind("design:" + id).run();
}
