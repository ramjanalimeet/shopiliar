import { currentUser } from "@/lib/auth";
import { book, CourierError, isCourier, loadAccount, saveAccount, trackUrl } from "@/lib/couriers";
import { api, clean, json, readJson } from "@/lib/http";

// Book a parcel with a connected courier, for one order
export const POST = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    if (!isCourier(id)) return json({ error: "Unknown courier." }, 404);
    const creds = await loadAccount(env, user.id, id);
    if (!creds) return json({ error: "Connect this courier first, in Shipping & Delivery." }, 400);
    const b = await readJson(req);
    const phone = clean(b.phone, 20).replace(/\D/g, "").replace(/^880/, "0");
    if (!/^01[3-9]\d{8}$/.test(phone)) return json({ error: "Enter the customer's 11-digit mobile number (01XXXXXXXXX)." }, 400);
    const parcel = {
      invoice: clean(b.invoice, 40).replace(/[^\w-]/g, "") || "order-" + Date.now(), name: clean(b.name, 100), phone, address: clean(b.address, 250),
      cod: Math.max(0, Math.round(Number(b.cod) || 0)), note: clean(b.note, 200), weight: Math.min(30, Math.max(0.1, Number(b.weight) || 0.5)),
      items: Math.max(1, Math.round(Number(b.items) || 1)), description: clean(b.description, 200),
      city: Number(b.city) || undefined, zone: Number(b.zone) || undefined, area: Number(b.area) || undefined, areaName: clean(b.areaName, 100),
    };
    if (!parcel.name || parcel.address.length < 10) return json({ error: "Enter the customer's name and full address." }, 400);
    try {
      const done = await book(env, id, creds, parcel);
      await saveAccount(env, user.id, id, creds); // keeps a fresh Pathao token
      return json({ ...done, courier: id, trackUrl: trackUrl(id, done.trackingCode, phone), sentAt: new Date().toISOString() });
    } catch (err) {
      if (err instanceof CourierError) return json({ error: err.message }, 400);
      throw err;
    }
  })(request);
};
