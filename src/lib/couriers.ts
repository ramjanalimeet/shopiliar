// Bangladeshi courier services a store can book parcels with, through each courier's merchant API.
// The store owner's API keys are kept here on the server (courier_accounts, created on first use) and never sent
// back to the browser. COURIER_BASE_<ID> in the environment can point a courier at another address (testing).

export type CourierId = "steadfast" | "pathao" | "redx";
export type Parcel = {
  invoice: string; name: string; phone: string; address: string; cod: number; note: string; weight: number; items: number; description: string;
  city?: number; zone?: number; area?: number; areaName?: string; store?: number;
};
export type Booked = { consignmentId: string; trackingCode: string; status: string; fee?: number };
type Creds = Record<string, string | number>;

export class CourierError extends Error {}

const BASES: Record<CourierId, string> = {
  steadfast: "https://portal.packzy.com/api/v1",
  pathao: "https://api-hermes.pathao.com",
  redx: "https://openapi.redx.com.bd/v1.0.0-beta",
};
const base = (env: CloudflareEnv, id: CourierId) => String((env as unknown as Record<string, string | undefined>)["COURIER_BASE_" + id.toUpperCase()] || BASES[id]);

// Public tracking pages, for the store owner and their customers
export const trackUrl = (id: string, code: string, phone = "") => {
  const c = encodeURIComponent(code);
  if (id === "steadfast") return `https://steadfast.com.bd/t/${c}`;
  if (id === "pathao") return `https://merchant.pathao.com/tracking?consignment_id=${c}&phone=${encodeURIComponent(phone)}`;
  if (id === "redx") return `https://redx.com.bd/track-parcel/?trackingId=${c}`;
  return "";
};

// What each courier needs to connect, as the dashboard asks for it
export const FIELDS: Record<CourierId, [string, string][]> = {
  steadfast: [["apiKey", "API key"], ["secretKey", "Secret key"]],
  pathao: [["clientId", "Client ID"], ["clientSecret", "Client secret"], ["username", "Merchant email"], ["password", "Merchant password"]],
  redx: [["token", "API access token"]],
};

const call = async (url: string, init: RequestInit): Promise<any> => {
  let res: Response;
  try { res = await fetch(url, { ...init, headers: { Accept: "application/json", ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers || {}) } }); }
  catch { throw new CourierError("Couldn't reach the courier. Please try again."); }
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = data?.message || data?.error || (data?.errors && JSON.stringify(data.errors)) || `The courier answered ${res.status}.`;
    throw new CourierError(typeof msg === "string" ? msg.slice(0, 300) : "The courier refused the request.");
  }
  return data;
};

// ---------- Steadfast ----------
const sf = (env: CloudflareEnv, c: Creds, path: string, init: RequestInit = {}) =>
  call(base(env, "steadfast") + path, { ...init, headers: { "Api-Key": String(c.apiKey), "Secret-Key": String(c.secretKey) } });

// ---------- Pathao: a token from the merchant login, kept until it expires ----------
const pathaoToken = async (env: CloudflareEnv, c: Creds): Promise<{ token: string; changed: boolean }> => {
  if (c.token && Number(c.tokenExpires) > Date.now() + 60_000) return { token: String(c.token), changed: false };
  const d = await call(base(env, "pathao") + "/aladdin/api/v1/issue-token", { method: "POST", body: JSON.stringify({ client_id: c.clientId, client_secret: c.clientSecret, grant_type: "password", username: c.username, password: c.password }) });
  if (!d.access_token) throw new CourierError("Pathao didn't accept these details.");
  c.token = d.access_token; c.tokenExpires = Date.now() + (Number(d.expires_in) || 3600) * 1000;
  return { token: d.access_token, changed: true };
};
const pt = async (env: CloudflareEnv, c: Creds, path: string, init: RequestInit = {}) => {
  const { token } = await pathaoToken(env, c);
  return call(base(env, "pathao") + path, { ...init, headers: { Authorization: "Bearer " + token } });
};

// ---------- RedX ----------
const rx = (env: CloudflareEnv, c: Creds, path: string, init: RequestInit = {}) =>
  call(base(env, "redx") + path, { ...init, headers: { "API-ACCESS-TOKEN": "Bearer " + String(c.token) } });

// Check the details work. Returns a short line for the dashboard (e.g. the balance) and any extra settings.
export async function verify(env: CloudflareEnv, id: CourierId, c: Creds): Promise<{ info: string; extra?: Creds }> {
  if (id === "steadfast") {
    const d = await sf(env, c, "/get_balance");
    return { info: d.current_balance != null ? `Balance ৳${Number(d.current_balance).toLocaleString("en-IN")}` : "Connected" };
  }
  if (id === "pathao") {
    const d = await pt(env, c, "/aladdin/api/v1/stores");
    const stores = (d?.data?.data || []) as { store_id: number; store_name: string }[];
    if (!stores.length) throw new CourierError("Your Pathao account has no store yet. Add one in the Pathao merchant panel first.");
    return { info: `Store: ${stores[0].store_name}`, extra: { storeId: stores[0].store_id, storeName: stores[0].store_name } };
  }
  const d = await rx(env, c, "/areas");
  return { info: `${(d?.areas || []).length} delivery areas` };
}

// Lists the booking form needs: Pathao cities and zones, RedX areas
export async function options(env: CloudflareEnv, id: CourierId, c: Creds, kind: string, parent: string): Promise<{ id: number; name: string }[]> {
  if (id === "pathao" && kind === "cities") return ((await pt(env, c, "/aladdin/api/v1/city-list"))?.data?.data || []).map((x: any) => ({ id: x.city_id, name: x.city_name }));
  if (id === "pathao" && kind === "zones" && /^\d+$/.test(parent)) return ((await pt(env, c, `/aladdin/api/v1/cities/${parent}/zone-list`))?.data?.data || []).map((x: any) => ({ id: x.zone_id, name: x.zone_name }));
  if (id === "redx" && kind === "areas") return ((await rx(env, c, "/areas"))?.areas || []).map((x: any) => ({ id: x.id, name: x.name }));
  return [];
}

// Book a parcel
export async function book(env: CloudflareEnv, id: CourierId, c: Creds, p: Parcel): Promise<Booked> {
  if (id === "steadfast") {
    const d = await sf(env, c, "/create_order", { method: "POST", body: JSON.stringify({ invoice: p.invoice, recipient_name: p.name, recipient_phone: p.phone, recipient_address: p.address, cod_amount: p.cod, note: p.note }) });
    const k = d?.consignment;
    if (!k?.consignment_id) throw new CourierError(d?.message || "Steadfast didn't book the parcel.");
    return { consignmentId: String(k.consignment_id), trackingCode: String(k.tracking_code || k.consignment_id), status: String(k.status || "in_review") };
  }
  if (id === "pathao") {
    if (!p.city || !p.zone) throw new CourierError("Choose the city and zone for Pathao.");
    const d = await pt(env, c, "/aladdin/api/v1/orders", { method: "POST", body: JSON.stringify({
      store_id: Number(c.storeId), merchant_order_id: p.invoice, recipient_name: p.name, recipient_phone: p.phone, recipient_address: p.address,
      recipient_city: p.city, recipient_zone: p.zone, delivery_type: 48, item_type: 2, special_instruction: p.note, item_quantity: p.items,
      item_weight: p.weight, amount_to_collect: p.cod, item_description: p.description,
    }) });
    const k = d?.data;
    if (!k?.consignment_id) throw new CourierError(d?.message || "Pathao didn't book the parcel.");
    return { consignmentId: String(k.consignment_id), trackingCode: String(k.consignment_id), status: String(k.order_status || "Pending"), fee: Number(k.delivery_fee) || undefined };
  }
  if (!p.area) throw new CourierError("Choose the delivery area for RedX.");
  const d = await rx(env, c, "/parcel", { method: "POST", body: JSON.stringify({
    customer_name: p.name, customer_phone: p.phone, delivery_area: p.areaName || "", delivery_area_id: p.area, customer_address: p.address,
    merchant_invoice_id: p.invoice, cash_collection_amount: String(p.cod), parcel_weight: Math.round(p.weight * 1000), instruction: p.note, value: p.cod,
  }) });
  if (!d?.tracking_id) throw new CourierError(d?.message || "RedX didn't book the parcel.");
  return { consignmentId: String(d.tracking_id), trackingCode: String(d.tracking_id), status: "pickup-pending" };
}

// Where a parcel is now
export async function status(env: CloudflareEnv, id: CourierId, c: Creds, consignmentId: string): Promise<string> {
  const cid = encodeURIComponent(consignmentId);
  if (id === "steadfast") return String((await sf(env, c, `/status_by_cid/${cid}`))?.delivery_status || "unknown");
  if (id === "pathao") return String((await pt(env, c, `/aladdin/api/v1/orders/${cid}/info`))?.data?.order_status || "unknown");
  return String((await rx(env, c, `/parcel/info/${cid}`))?.parcel?.status || "unknown");
}

// ---------- Saved accounts ----------
let ready = false;
const ensure = async (env: CloudflareEnv) => {
  if (ready) return;
  await env.DB.prepare("CREATE TABLE IF NOT EXISTS courier_accounts (user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, courier TEXT NOT NULL, data TEXT NOT NULL, updated_at TEXT NOT NULL, PRIMARY KEY (user_id, courier))").run();
  ready = true;
};
export const isCourier = (v: string): v is CourierId => v === "steadfast" || v === "pathao" || v === "redx";
export async function loadAccount(env: CloudflareEnv, userId: string, id: CourierId): Promise<Creds | null> {
  await ensure(env);
  const row = await env.DB.prepare("SELECT data FROM courier_accounts WHERE user_id = ? AND courier = ?").bind(userId, id).first<{ data: string }>();
  try { return row ? JSON.parse(row.data) : null; } catch { return null; }
}
export async function saveAccount(env: CloudflareEnv, userId: string, id: CourierId, c: Creds) {
  await ensure(env);
  await env.DB.prepare("INSERT INTO courier_accounts (user_id, courier, data, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, courier) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at")
    .bind(userId, id, JSON.stringify(c), new Date().toISOString()).run();
}
export async function removeAccount(env: CloudflareEnv, userId: string, id: CourierId) {
  await ensure(env);
  await env.DB.prepare("DELETE FROM courier_accounts WHERE user_id = ? AND courier = ?").bind(userId, id).run();
}
export async function listAccounts(env: CloudflareEnv, userId: string): Promise<Record<string, Creds>> {
  await ensure(env);
  const { results } = await env.DB.prepare("SELECT courier, data FROM courier_accounts WHERE user_id = ?").bind(userId).all<{ courier: string; data: string }>();
  const out: Record<string, Creds> = {};
  results.forEach((r) => { try { out[r.courier] = JSON.parse(r.data); } catch { /* skip */ } });
  return out;
}
// What the dashboard may see about a saved account: never the keys themselves
export const publicAccount = (id: CourierId, c: Creds) => ({
  connected: true, info: String(c.info || "Connected"),
  hint: id === "pathao" ? String(c.username || "") : String(c.apiKey || c.token || "").slice(0, 4) + "••••",
  storeName: c.storeName ? String(c.storeName) : undefined,
});
