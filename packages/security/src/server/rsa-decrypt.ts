import { constants, privateDecrypt } from "node:crypto";

export function rsaDecrypt(
  ciphertextBase64: string,
  privateKeyPem: string,
): string {
  const cipher = Buffer.from(ciphertextBase64, "base64");
  const plain = privateDecrypt(
    {
      key: privateKeyPem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: "sha256",
    },
    cipher,
  );
  return plain.toString("utf8");
}
