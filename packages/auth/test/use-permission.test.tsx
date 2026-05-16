import { describe, expect, it } from "vitest";
import { render, renderHook } from "@testing-library/react";
import {
  PermissionsProvider,
  useCan,
  usePermissions,
} from "../src/client/index.ts";

describe("useCan", () => {
  it("returns true when check passes", () => {
    const { result } = renderHook(() => useCan({ all: ["a"] }), {
      wrapper: ({ children }) => (
        <PermissionsProvider permissions={["a", "b"]}>
          {children}
        </PermissionsProvider>
      ),
    });
    expect(result.current).toBe(true);
  });

  it("returns false when check fails", () => {
    const { result } = renderHook(() => useCan({ all: ["c"] }), {
      wrapper: ({ children }) => (
        <PermissionsProvider permissions={["a", "b"]}>
          {children}
        </PermissionsProvider>
      ),
    });
    expect(result.current).toBe(false);
  });
});

describe("usePermissions", () => {
  it("throws when used outside provider", () => {
    function Probe() {
      usePermissions();
      return null;
    }
    expect(() => render(<Probe />)).toThrow(
      /must be used within <PermissionsProvider>/,
    );
  });
});
