import { atom } from "jotai";

/** Current user ID */
export const userIdAtom = atom<number>(0);

/** Current user display name */
export const userLoginAtom = atom<string>("");

/** Whether current user is an admin */
export const userIsAdminAtom = atom<boolean>(false);

/** Write-only atom to populate user state from batch response */
export const initUserFromBatchAtom = atom(
  null,
  (
    _get,
    set,
    data: {
      id?: number;
      name?: string;
      lastName?: string;
      isAdmin?: boolean;
    },
  ) => {
    set(userIdAtom, data.id ?? 0);
    set(
      userLoginAtom,
      [data.name, data.lastName].filter(Boolean).join(" ") || " ",
    );
    set(userIsAdminAtom, data.isAdmin ?? false);
  },
);
