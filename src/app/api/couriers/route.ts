import { currentUser } from "@/lib/auth";
import { listAccounts, publicAccount, type CourierId } from "@/lib/couriers";
import { api, json } from "@/lib/http";

// The couriers this store has connected (never the keys)
export const GET = api(async (request, env) => {
  const user = await currentUser(request, env);
  if (!user) return json({ error: "Not signed in." }, 401);
  const all = await listAccounts(env, user.id);
  return json({ couriers: Object.fromEntries(Object.entries(all).map(([id, c]) => [id, publicAccount(id as CourierId, c)])) });
});
