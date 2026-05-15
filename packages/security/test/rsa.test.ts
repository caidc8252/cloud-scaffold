// @vitest-environment node
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { rsaEncrypt } from "../src/client/index.ts";
import { rsaDecrypt } from "../src/server/index.ts";

const FIXTURES = resolve(process.cwd(), "packages/security/test/fixtures");
const pub = readFileSync(resolve(FIXTURES, "test-public.pem"), "utf-8");
const priv = readFileSync(resolve(FIXTURES, "test-private.pem"), "utf-8");

describe("rsa round trip", () => {
  it("encrypts on client, decrypts on server", async () => {
    const plain = JSON.stringify({ password: "hunter2", ts: Date.now() });
    const cipher = await rsaEncrypt(plain, pub);
    expect(rsaDecrypt(cipher, priv)).toBe(plain);
  });

  it("two encryptions of same plaintext yield different ciphertexts (OAEP randomness)", async () => {
    const a = await rsaEncrypt("same", pub);
    const b = await rsaEncrypt("same", pub);
    expect(a).not.toBe(b);
  });

  it("rsaDecrypt throws on corrupted ciphertext", () => {
    expect(() => rsaDecrypt("not-base64-cipher-text-zzz", priv)).toThrow();
  });

  it("rsaEncrypt throws when input is not an SPKI PEM", async () => {
    await expect(rsaEncrypt("x", "not a pem")).rejects.toThrow();
  });
});
