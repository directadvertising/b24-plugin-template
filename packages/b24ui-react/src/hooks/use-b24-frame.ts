import type { B24Frame } from "@bitrix24/b24jssdk";
import { useAtomValue } from "jotai";
import { b24FrameAtom } from "../atoms/b24-frame.js";

/**
 * Returns the B24Frame instance. Throws if not yet initialized.
 */
export function useB24Frame(): B24Frame {
  const frame = useAtomValue(b24FrameAtom);
  if (!frame) {
    throw new Error(
      "B24Frame is not initialized. Call useB24Init().initApp() first.",
    );
  }
  return frame;
}

/**
 * Returns the B24Frame instance or null if not yet initialized.
 */
export function useB24FrameOrNull(): B24Frame | null {
  return useAtomValue(b24FrameAtom);
}
