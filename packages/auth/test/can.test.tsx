import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { Can, PermissionsProvider } from "../src/client/index.ts";

function wrap(perms: string[], ui: React.ReactNode) {
  return render(
    <PermissionsProvider permissions={perms}>{ui}</PermissionsProvider>,
  );
}

describe("<Can>", () => {
  it("renders children when all permissions hit", () => {
    wrap(
      ["a", "b"],
      <Can all={["a", "b"]}>
        <span>ok</span>
      </Can>,
    );
    expect(screen.getByText("ok")).toBeTruthy();
  });

  it("renders fallback when missing perm", () => {
    wrap(
      ["a"],
      <Can all={["a", "b"]} fallback={<span>nope</span>}>
        <span>ok</span>
      </Can>,
    );
    expect(screen.getByText("nope")).toBeTruthy();
    expect(screen.queryByText("ok")).toBeNull();
  });

  it("renders null when missing perm and no fallback", () => {
    const { container } = wrap(
      [],
      <Can all={["a"]}>
        <span>ok</span>
      </Can>,
    );
    expect(container.textContent).toBe("");
  });

  it("any: one match is enough", () => {
    wrap(
      ["b"],
      <Can any={["a", "b"]}>
        <span>ok</span>
      </Can>,
    );
    expect(screen.getByText("ok")).toBeTruthy();
  });
});
