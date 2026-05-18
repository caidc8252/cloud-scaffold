import { describe, expect, it } from "vitest";
import {
  createdResponse,
  errorResponse,
  noContentResponse,
  successResponse,
} from "../src/server.ts";

describe("successResponse", () => {
  it("wraps data with 200", async () => {
    const res = successResponse({ id: 1 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ data: { id: 1 } });
  });

  it("includes pager when provided", async () => {
    const pager = { page: 1, limit: 20, total: 42, totalPages: 3 };
    const res = successResponse([{ id: 1 }], pager);
    expect(await res.json()).toEqual({ data: [{ id: 1 }], pager });
  });

  it("omits pager key when not provided", async () => {
    const body = (await successResponse({ id: 1 }).json()) as Record<
      string,
      unknown
    >;
    expect(body).not.toHaveProperty("pager");
  });
});

describe("createdResponse", () => {
  it("returns 201 with data", async () => {
    const res = createdResponse({ id: 42 });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ data: { id: 42 } });
  });
});

describe("noContentResponse", () => {
  it("returns 204 with empty body", async () => {
    const res = noContentResponse();
    expect(res.status).toBe(204);
    expect(await res.text()).toBe("");
  });
});

describe("errorResponse", () => {
  it("defaults to 400", async () => {
    const res = errorResponse("oops");
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ message: "oops" });
  });

  it("honors custom status", async () => {
    expect(errorResponse("x", 422).status).toBe(422);
    expect(errorResponse("x", 500).status).toBe(500);
  });
});
