// AES-GCM encryption helper for storing user API keys at rest.
// Format of returned string: base64(iv) + "." + base64(ciphertext+tag)

const ENC_SECRET = Deno.env.get("USER_KEY_ENCRYPTION_SECRET") ?? "";

async function getKey(): Promise<CryptoKey> {
  if (!ENC_SECRET) throw new Error("USER_KEY_ENCRYPTION_SECRET missing");
  const hash = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(ENC_SECRET));
  return crypto.subtle.importKey("raw", hash, { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

function b64encode(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

function b64decode(s: string): Uint8Array {
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function encryptSecret(plain: string): Promise<string> {
  const key = await getKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, new TextEncoder().encode(plain)),
  );
  return `${b64encode(iv)}.${b64encode(ct)}`;
}

export async function decryptSecret(payload: string): Promise<string> {
  const [ivB64, ctB64] = payload.split(".");
  if (!ivB64 || !ctB64) throw new Error("invalid ciphertext");
  const key = await getKey();
  const plain = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: b64decode(ivB64) },
    key,
    b64decode(ctB64),
  );
  return new TextDecoder().decode(plain);
}

export function keyHint(plain: string): string {
  return plain.slice(-4);
}
