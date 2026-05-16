"use client";

import { useContext } from "react";
import { PermissionsContext } from "./provider.tsx";

export type PermCheck = { all?: string[]; any?: string[] };

export function usePermissions(): readonly string[] {
  const ctx = useContext(PermissionsContext);
  if (ctx === null) {
    throw new Error(
      "usePermissions must be used within <PermissionsProvider>",
    );
  }
  return ctx;
}

export function useCan(check: PermCheck): boolean {
  const have = usePermissions();
  const all = check.all ?? [];
  const any = check.any ?? [];
  const okAll = all.every((p) => have.includes(p));
  const okAny = any.length === 0 || any.some((p) => have.includes(p));
  return okAll && okAny;
}
