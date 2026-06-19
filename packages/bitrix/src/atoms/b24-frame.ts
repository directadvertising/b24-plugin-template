import type { B24Frame } from "@bitrix24/b24jssdk";
import { atom } from "jotai";

/** Core B24Frame instance — null until initialized */
export const b24FrameAtom = atom<B24Frame | null>(null);

/** Current portal language code */
export const langAtom = atom<string>((get) => {
  const frame = get(b24FrameAtom);
  return frame?.getLang() ?? "en";
});

/** Application SID */
export const appSidAtom = atom<string>((get) => {
  const frame = get(b24FrameAtom);
  return frame?.getAppSid() ?? "";
});

/** Whether the app is in install mode */
export const isInstallModeAtom = atom<boolean>((get) => {
  const frame = get(b24FrameAtom);
  if (!frame) return false;
  try {
    return frame.isInstallMode;
  } catch {
    return false;
  }
});

/** Current placement context */
export const placementAtom = atom<string>((get) => {
  const frame = get(b24FrameAtom);
  if (!frame) return "";
  try {
    const placement = frame.placement;
    return placement?.title ?? "";
  } catch {
    return "";
  }
});
