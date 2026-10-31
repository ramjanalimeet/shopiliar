import { currentUser } from "@/lib/auth";
import { CourierError, isCourier, loadAccount, options, saveAccount } from "@/lib/couriers";
import { api, json } from "@/lib/http";

// Lists for the booking form: ?kind=cities or ?kind=zones&parent=<city> (Pathao), ?kind=areas (RedX)
export const GET = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return api(async (req, env, url) => {
    const user = await currentUser(req, env);
    if (!user) return json({ error: "Not signed in." }, 401);
    if (!isCourier(id)) return json({ error: "Unknown courier." }, 404);
    const creds = await loadAccount(env, user.id, id);
    if (!creds) return json({ error: "Connect this courier first." }, 400);
    try {
      const list = await options(env, id, creds, url.searchParams.get("kind") || "", url.searchParams.get("parent") || "");
      await saveAccount(env, user.id, id, creds);
      return json({ options: list });
    } catch (err) {
      if (err instanceof CourierError) return json({ error: err.message }, 400);
      throw err;
    }
  })(request);
};
