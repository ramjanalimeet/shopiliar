import { currentUser } from "@/lib/auth";
import { CourierError, isCourier, loadAccount, saveAccount, status } from "@/lib/couriers";
import { api, json } from "@/lib/http";

// Where a parcel is now, asked from the courier
export const GET = async (request: Request, { params }: { params: Promise<{ id: string; cid: string }> }) => {
  const { id, cid } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    if (!isCourier(id) || !/^[\w-]{1,60}$/.test(cid)) return json({ error: "Unknown parcel." }, 404);
    const creds = await loadAccount(env, user.id, id);
    if (!creds) return json({ error: "This courier isn't connected any more." }, 400);
    try {
      const s = await status(env, id, creds, cid);
      await saveAccount(env, user.id, id, creds);
      return json({ status: s, checkedAt: new Date().toISOString() });
    } catch (err) {
      if (err instanceof CourierError) return json({ error: err.message }, 400);
      throw err;
    }
  })(request);
};
