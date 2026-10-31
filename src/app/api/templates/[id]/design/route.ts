import { TEMPLATE_ID, designOf } from "@/lib/designs";
import { api, json } from "@/lib/http";
import { getDesign } from "@/lib/platform";

// A template's saved design, so a new store on that template starts from it (404 when it has none)
export const GET = async (request: Request, { params }: { params: Promise<{ id: string }> }) => {
  const { id } = await params;
  return api(async (_req, env) => {
    const design = TEMPLATE_ID.test(id) ? designOf(await getDesign(env, id)) : null;
    return design ? json(design) : json({ error: "No saved design." }, 404);
  })(request);
};
