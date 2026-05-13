"use client";

import { create } from "zustand";

export type AccountSnapshot = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
};

type AuthState = {
  account: AccountSnapshot | null;
  roles: string[];
  permissions: string[];
  setAccountSnapshot: (snapshot: {
    account: AccountSnapshot;
    roles: string[];
    permissions: string[];
  }) => void;
  clearAuthCache: () => void;
  hasPermission: (permission: string | string[]) => boolean;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  account: null,
  roles: [],
  permissions: [],
  setAccountSnapshot: (snapshot) =>
    set({
      account: snapshot.account,
      roles: snapshot.roles,
      permissions: snapshot.permissions,
    }),
  clearAuthCache: () => set({ account: null, roles: [], permissions: [] }),
  hasPermission: (permission) => {
    const permissions = Array.isArray(permission) ? permission : [permission];
    const permissionSet = new Set(get().permissions);
    return permissions.some((item) => permissionSet.has(item));
  },
}));
