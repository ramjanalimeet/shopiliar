import { currentUser } from "@/lib/auth";
import { CourierError, FIELDS, isCourier, publicAccount, removeAccount, saveAccount, verify } from "@/lib/couriers";
import { api, clean, json, readJson } from "@/lib/http";

type Ctx = { params: Promise<{ id: string }> };

// Connect a courier: the details are checked with the courier before they're saved
export const PUT = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    if (!isCourier(id)) return json({ error: "Unknown courier." }, 404);
    const b = await readJson(req);
    const creds: Record<string, string | number> = {};
    for (const [k, label] of FIELDS[id]) {
      creds[k] = clean(b[k], 300);
      if (!creds[k]) return json({ error: `Please enter the ${label.toLowerCase()}.` }, 400);
    }
    try {
      const { info, extra } = await verify(env, id, creds);
      Object.assign(creds, extra || {}, { info });
      await saveAccount(env, user.id, id, creds);
      return json(publicAccount(id, creds));
    } catch (err) {
      if (err instanceof CourierError) return json({ error: err.message }, 400);
      throw err;
    }
  })(request);
};

// Disconnect: the saved details are deleted
export const DELETE = async (request: Request, { params }: Ctx) => {
  const { id } = await params;
  return api(async (req, env) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    if (!isCourier(id)) return json({ error: "Unknown courier." }, 404);
    await removeAccount(env, user.id, id);
    return json({ ok: true });
  })(request);
};
