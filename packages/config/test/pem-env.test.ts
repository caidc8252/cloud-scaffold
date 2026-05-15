import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const ORIGINAL_ENV = { ...process.env };

async function freshGetEnv() {
  vi.resetModules();
  const mod = await import("../src/index.ts");
  return mod.getEnv;
}

beforeEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

afterEach(() => {
  process.env = { ...ORIGINAL_ENV };
});

describe("config PEM env validation", () => {
  it("accepts a valid multi-line PEM", async () => {
    const getEnv = await freshGetEnv();
    expect(() => getEnv()).not.toThrow();
  });

  it("normalizes \\n literals to real newlines and accepts the result", async () => {
    process.env.LOGIN_PUBLIC_KEY_PEM = ORIGINAL_ENV.LOGIN_PUBLIC_KEY_PEM!.replace(
      /\n/g,
      "\\n",
    );
    process.env.LOGIN_PRIVATE_KEY_PEM = ORIGINAL_ENV.LOGIN_PRIVATE_KEY_PEM!.replace(
      /\n/g,
      "\\n",
    );
    const getEnv = await freshGetEnv();
    expect(() => getEnv()).not.toThrow();
  });

  it("rejects malformed public key (missing header)", async () => {
    process.env.LOGIN_PUBLIC_KEY_PEM = "not a pem";
    const getEnv = await freshGetEnv();
    expect(() => getEnv()).toThrow();
  });

  it("rejects swapping private key into public key slot", async () => {
    process.env.LOGIN_PUBLIC_KEY_PEM = ORIGINAL_ENV.LOGIN_PRIVATE_KEY_PEM!;
    const getEnv = await freshGetEnv();
    expect(() => getEnv()).toThrow();
  });
});
