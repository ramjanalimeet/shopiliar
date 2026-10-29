// Small crypto helpers shared by sessions, passwords and Google sign-in. Web Crypto only, so they run
// the same on Cloudflare Workers and in `next dev`.
export const PBKDF2_ITERATIONS = 100000; // the maximum Workers allows

export const randomBytes = (n: number) => crypto.getRandomValues(new Uint8Array(n));
export const b64 = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
export const unb64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), (c) => c.charCodeAt(0));
export const hex = (buf: ArrayBuffer) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export const sha256 = async (text: string) => hex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)));
export const encodeText = (s: string) => new TextEncoder().encode(s);
export const decodeText = (b: Uint8Array) => new TextDecoder().decode(b);

export async function hashPassword(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", encodeText(password), "PBKDF2", false, ["deriveBits"]);
  return hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: salt as BufferSource, iterations: PBKDF2_ITERATIONS }, key, 256));
}

/** Constant-time string comparison (hashes), so timing doesn't reveal how much of a guess was right. */
export function safeEqual(a: string, b: string) {
  const x = encodeText(a), y = encodeText(b);
  if (x.length !== y.length) return false;
  let diff = 0;
  for (let i = 0; i < x.length; i++) diff |= x[i] ^ y[i];
  return diff === 0;
}
