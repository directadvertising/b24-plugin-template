import type { B24Frame } from "@bitrix24/b24jssdk";
import {
  initializeB24Frame,
  LoadDataType,
  LoggerBrowser,
  useB24Helper,
} from "@bitrix24/b24jssdk";
import { useSetAtom } from "jotai";
import { useCallback, useRef, useState } from "react";
import { tokenJWTAtom } from "../atoms/api.js";
import { initAppSettingsAtom } from "../atoms/app-settings.js";
import { b24FrameAtom } from "../atoms/b24-frame.js";
import { initUserFromBatchAtom } from "../atoms/user.js";
import { initUserSettingsAtom } from "../atoms/user-settings.js";
import { getToken } from "../lib/api-client.js";
import { type B24Error, classifyError } from "../lib/errors.js";
import { useB24Config } from "../provider.js";

export interface UseB24InitOptions {
  loggerTitle?: string;
  onLocaleDetected?: (lang: string) => void | Promise<void>;
  loadDataTypes?: LoadDataType[];
}

export interface UseB24InitReturn {
  initApp: () => Promise<B24Frame>;
  isInitialized: boolean;
  isLoading: boolean;
  error: B24Error | null;
  logger: LoggerBrowser;
}

// biome-ignore lint/correctness/useHookAtTopLevel: useB24Helper is a B24 SDK factory, not a React hook
const { initB24Helper, getB24Helper, destroyB24Helper } = useB24Helper();

/**
 * Orchestrator hook — initializes B24Frame, loads data via batch, populates atoms, obtains JWT.
 *
 * Returns `initApp()` function that the consumer calls manually (e.g. in useEffect).
 * This avoids React StrictMode double-init issues.
 */
export function useB24Init(options?: UseB24InitOptions): UseB24InitReturn {
  const config = useB24Config();
  const isDev = config.isDev ?? false;

  const logger = useRef(
    LoggerBrowser.build(options?.loggerTitle ?? "App", isDev),
  ).current;

  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<B24Error | null>(null);

  const setB24Frame = useSetAtom(b24FrameAtom);
  const setTokenJWT = useSetAtom(tokenJWTAtom);
  const setUser = useSetAtom(initUserFromBatchAtom);
  const setAppSettings = useSetAtom(initAppSettingsAtom);
  const setUserSettings = useSetAtom(initUserSettingsAtom);

  const initAppFn = useCallback(async (): Promise<B24Frame> => {
    logger.info("InitApp start");
    setIsLoading(true);
    setError(null);

    try {
      // 1. Initialize B24Frame
      const $b24: B24Frame = await initializeB24Frame();
      setB24Frame($b24);

      // 2. Detect locale
      const lang = $b24.getLang();
      if (options?.onLocaleDetected) {
        await options.onLocaleDetected(lang);
        logger.log("setLocale >>>", lang);
      }

      // 3. Batch load via B24Helper
      const loadTypes = options?.loadDataTypes ?? [
        LoadDataType.App,
        LoadDataType.AppOptions,
        LoadDataType.UserOptions,
        LoadDataType.Currency,
        LoadDataType.Profile,
      ];
      await initB24Helper($b24, loadTypes);

      const helper = getB24Helper();
      const data = {
        appInfo: helper.appInfo,
        appSettings: helper.appOptions,
        userSettings: helper.userOptions,
        profileData: helper.profileInfo,
      };
      logger.log("Init data >>", data);

      // 4. Populate atoms from batch
      setUser({
        id: data.profileData?.data.id ?? undefined,
        name: data.profileData?.data.name ?? undefined,
        lastName: data.profileData?.data.lastName ?? undefined,
        isAdmin: data.profileData?.data.isAdmin,
      });

      setAppSettings({
        b24: $b24,
        version: data.appInfo?.data.version ?? 1,
        status: data.appInfo?.data.status,
        configSettings: (data.appSettings?.data ?? new Map()).get(
          "configSettings",
        ),
      });

      setUserSettings({
        b24: $b24,
        configSettings: (data.userSettings?.data ?? new Map()).get(
          "configSettings",
        ),
      });

      // 5. Get JWT
      const authData = $b24.auth.getAuthData();
      if (authData === false) {
        throw new Error("Auth data unavailable. Check app logic.");
      }

      const domain = authData.domain
        .replace("https://", "")
        .replace("http://", "")
        .replace(/\/$/, "");

      const response = await getToken(config.apiBaseUrl, {
        DOMAIN: domain,
        PROTOCOL: authData.domain.includes("https://") ? 1 : 0,
        LANG: $b24.getLang(),
        APP_SID: $b24.getAppSid(),
        AUTH_ID: authData.access_token,
        AUTH_EXPIRES: authData.expires_in,
        REFRESH_ID: authData.refresh_token,
        REFRESH_TOKEN: authData.refresh_token,
        member_id: authData.member_id,
      });

      setTokenJWT(response.token);

      setIsInitialized(true);
      logger.info("InitApp stop");

      return $b24;
    } catch (err) {
      const classified = classifyError(err);
      setError(classified);
      logger.error(err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [
    config.apiBaseUrl,
    logger,
    options,
    setB24Frame,
    setTokenJWT,
    setUser,
    setAppSettings,
    setUserSettings,
  ]);

  return {
    initApp: initAppFn,
    isInitialized,
    isLoading,
    error,
    logger,
  };
}

export { destroyB24Helper };
