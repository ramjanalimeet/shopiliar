import { currentUser, publicAccount } from "@/lib/auth";
import { api, json } from "@/lib/http";
import { getSettings } from "@/lib/platform";

export const GET = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const store = await env.DB.prepare("SELECT data FROM stores WHERE user_id = ?").bind(user.id).first<{ data: string }>();
  // A maintenance notice from the master dashboard shows at the top of the store dashboard
  const s = await getSettings(env);
  return json({ account: publicAccount(user), store: store ? JSON.parse(store.data) : null, notice: s.maintenance ? s.maintenanceText : "" });
});
