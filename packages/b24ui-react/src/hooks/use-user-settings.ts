import { useAtomValue, useSetAtom } from "jotai";
import {
  saveUserSettingsAtom,
  updateUserConfigSettingsAtom,
  userConfigSettingsAtom,
} from "../atoms/user-settings.js";

/**
 * Access and manage user-level settings.
 */
export function useUserSettings() {
  const configSettings = useAtomValue(userConfigSettingsAtom);
  const updateSettings = useSetAtom(updateUserConfigSettingsAtom);
  const saveSettings = useSetAtom(saveUserSettingsAtom);

  return {
    configSettings,
    updateSettings,
    saveSettings,
  };
}
