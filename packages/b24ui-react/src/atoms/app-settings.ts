import type { B24Frame, TypeEnumAppStatus } from "@bitrix24/b24jssdk";
import { atom } from "jotai";

/** Internal B24Frame reference for saving */
const appSettingsB24Atom = atom<B24Frame | null>(null);

/** App version */
export const appVersionAtom = atom<number>(0);

/** App status */
export const appStatusAtom = atom<TypeEnumAppStatus>("Free");

/** Whether app is in trial mode */
export const appIsTrialAtom = atom<boolean>((get) => {
  return get(appStatusAtom) === "Trial";
});

/** App-level config settings (key-value) */
export const appConfigSettingsAtom = atom<Record<string, unknown>>({});

/** Write-only atom to initialize app settings from batch response */
export const initAppSettingsAtom = atom(
  null,
  (
    _get,
    set,
    data: {
      b24: B24Frame;
      version?: number;
      status?: TypeEnumAppStatus;
      configSettings?: Record<string, unknown>;
    },
  ) => {
    set(appSettingsB24Atom, data.b24);
    if (data.status) {
      set(appStatusAtom, data.status);
    }
    if (data.version) {
      set(appVersionAtom, data.version);
    }
    if (data.configSettings) {
      set(appConfigSettingsAtom, data.configSettings);
    }
  },
);

/** Write atom to update config settings locally */
export const updateAppConfigSettingsAtom = atom(
  null,
  (_get, set, updates: Record<string, unknown>) => {
    set(appConfigSettingsAtom, (prev) => ({ ...prev, ...updates }));
  },
);

/** Write atom to save app settings to Bitrix24 */
export const saveAppSettingsAtom = atom(null, async (get) => {
  const b24 = get(appSettingsB24Atom);
  if (!b24) {
    console.error("B24 not initialized. Cannot save app settings.");
    return;
  }
  const configSettings = get(appConfigSettingsAtom);
  return b24.callMethod("app.option.set", {
    configSettings: { ...configSettings },
  });
});
