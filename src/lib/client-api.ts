// Browser-side helper for the account API: JSON in, JSON out, errors as messages people can read
export type ApiError = { error?: string };

export async function postJson<T = Record<string, unknown>>(path: string, body: unknown): Promise<T> {
  const res = await fetch(path, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = (await res.json().catch(() => ({}))) as T & ApiError;
  if (!res.ok) throw new Error(data.error || "Something went wrong. Please try again.");
  return data;
}
