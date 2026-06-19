import { atom } from "jotai";

/** JWT token for backend API calls */
export const tokenJWTAtom = atom<string>("");

/** Whether the JWT token has been initialized */
export const isInitTokenJWTAtom = atom<boolean>((get) => {
  return get(tokenJWTAtom).length > 2;
});
