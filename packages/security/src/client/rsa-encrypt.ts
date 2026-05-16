const PEM_HEADER = "-----BEGIN PUBLIC KEY-----";
const PEM_FOOTER = "-----END PUBLIC KEY-----";

function pemToSpkiBytes(pem: string): Uint8Array {
  const trimmed = pem.trim();
  const start = trimmed.indexOf(PEM_HEADER);
  const end = trimmed.indexOf(PEM_FOOTER);
  if (start < 0 || end < 0 || end <= start) {
    throw new Error("rsaEncrypt: input is not an SPKI PEM public key");
  }
  const base64 = trimmed
    .slice(start + PEM_HEADER.length, end)
    .replace(/\s+/g, "");
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < view.byteLength; i += 1) {
    binary += String.fromCharCode(view[i]);
  }
  return btoa(binary);
}

export async function rsaEncrypt(
  plaintext: string,
  publicKeyPem: string,
): Promise<string> {
  const subtle = globalThis.crypto?.subtle;
  if (!subtle) {
    throw new Error("rsaEncrypt: SubtleCrypto unavailable in this runtime");
  }
  const spkiBytes = pemToSpkiBytes(publicKeyPem);
  const key = await subtle.importKey(
    "spki",
    spkiBytes as BufferSource,
    { name: "RSA-OAEP", hash: "SHA-256" },
    false,
    ["encrypt"],
  );
  const encoded = new TextEncoder().encode(plaintext);
  const cipher = await subtle.encrypt({ name: "RSA-OAEP" }, key, encoded);
  return bytesToBase64(cipher);
}
