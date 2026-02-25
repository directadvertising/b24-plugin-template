import type { B24Frame } from "@bitrix24/b24jssdk";
import { atom } from "jotai";

/** Internal B24Frame reference for saving */
const userSettingsB24Atom = atom<B24Frame | null>(null);

/** User-level config settings (key-value) */
export const userConfigSettingsAtom = atom<Record<string, unknown>>({});

/** Write-only atom to initialize user settings from batch response */
export const initUserSettingsAtom = atom(
  null,
  (
    _get,
    set,
    data: {
      b24: B24Frame;
      configSettings?: Record<string, unknown>;
    },
  ) => {
    set(userSettingsB24Atom, data.b24);
    if (data.configSettings) {
      set(userConfigSettingsAtom, data.configSettings);
    }
  },
);

/** Write atom to update config settings locally */
export const updateUserConfigSettingsAtom = atom(
  null,
  (_get, set, updates: Record<string, unknown>) => {
    set(userConfigSettingsAtom, (prev) => ({ ...prev, ...updates }));
  },
);

/** Write atom to save user settings to Bitrix24 */
export const saveUserSettingsAtom = atom(null, async (get) => {
  const b24 = get(userSettingsB24Atom);
  if (!b24) {
    console.error("B24 not initialized. Cannot save user settings.");
    return;
  }
  const configSettings = get(userConfigSettingsAtom);
  return b24.callMethod("user.option.set", {
    configSettings: { ...configSettings },
  });
});
