import { useAtomValue, useSetAtom } from "jotai";
import {
  appConfigSettingsAtom,
  appIsTrialAtom,
  appStatusAtom,
  appVersionAtom,
  saveAppSettingsAtom,
  updateAppConfigSettingsAtom,
} from "../atoms/app-settings.js";

/**
 * Access and manage app-level settings.
 */
export function useAppSettings() {
  const version = useAtomValue(appVersionAtom);
  const status = useAtomValue(appStatusAtom);
  const isTrial = useAtomValue(appIsTrialAtom);
  const configSettings = useAtomValue(appConfigSettingsAtom);
  const updateSettings = useSetAtom(updateAppConfigSettingsAtom);
  const saveSettings = useSetAtom(saveAppSettingsAtom);

  return {
    version,
    status,
    isTrial,
    configSettings,
    updateSettings,
    saveSettings,
  };
}
