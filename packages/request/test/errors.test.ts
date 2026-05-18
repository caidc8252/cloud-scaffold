import { beforeEach, describe, expect, it, vi } from "vitest";

const translate = vi.fn(async (namespace: string) => {
  return (key: string) => `[${namespace}.${key}]`;
});

vi.mock("next-intl/server", () => ({
  getTranslations: (namespace: string) => translate(namespace),
}));

import {
  badRequestResponse,
  forbiddenResponse,
  notFoundResponse,
  unauthorizedResponse,
} from "../src/server.ts";

beforeEach(() => {
  translate.mockClear();
});

describe("status-named error helpers", () => {
  it("badRequestResponse defaults to 400 + auto-translated message", async () => {
    const res = await badRequestResponse();
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "[request.errors.badRequest]" });
  });

  it("unauthorizedResponse → 401", async () => {
    const res = await unauthorizedResponse();
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({
      message: "[request.errors.unauthorized]",
    });
  });

  it("forbiddenResponse → 403", async () => {
    const res = await forbiddenResponse();
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ message: "[request.errors.forbidden]" });
  });

  it("notFoundResponse → 404", async () => {
    const res = await notFoundResponse();
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ message: "[request.errors.notFound]" });
  });

  it("caller-provided message bypasses i18n lookup", async () => {
    const res = await forbiddenResponse("custom forbidden text");
    expect(translate).not.toHaveBeenCalled();
    expect(await res.json()).toEqual({ message: "custom forbidden text" });
  });
});
