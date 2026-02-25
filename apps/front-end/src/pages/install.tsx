import type { B24Frame } from "@bitrix24/b24jssdk";
import { initializeB24Frame, LoggerBrowser } from "@bitrix24/b24jssdk";
import { postInstall, sleepAction } from "@common/b24ui-react";
import { useEffect, useRef, useState } from "react";

const appUrl = (import.meta.env.VITE_APP_URL ?? "").replace(/\/$/, "");

interface AppInfo {
  LICENSE?: string;
  LICENSE_FAMILY?: string;
  STATUS?: string;
  VERSION?: string | number;
  CODE?: string;
  ID?: string | number;
}

interface InitData {
  appInfo?: AppInfo;
  profile?: { ID?: string | number };
  placementList?: { placement: string; handler: string }[];
  userFieldTypeList?: { USER_TYPE_ID: string }[];
}

interface Step {
  caption: string;
  action: () => Promise<void>;
}

export default function InstallPage() {
  const [currentStep, setCurrentStep] = useState("init");
  const [progress, setProgress] = useState<number | null>(null);
  const [progressColor, setProgressColor] = useState<"blue" | "green">("blue");
  const [error, setError] = useState<string | null>(null);
  const initCalled = useRef(false);

  const logger = useRef(
    LoggerBrowser.build("Install", import.meta.env.DEV),
  ).current;

  useEffect(() => {
    if (initCalled.current) return;
    initCalled.current = true;

    runInstall();
  });

  async function runInstall() {
    let $b24: B24Frame;

    try {
      $b24 = await initializeB24Frame();
    } catch (err) {
      logger.error(err);
      setError("Failed to initialize B24Frame");
      return;
    }

    const stepsData: { init?: InitData } = {};

    const steps: Record<string, Step> = {
      init: {
        caption: "Initializing...",
        action: async () => {
          const response = await $b24.callBatch({
            appInfo: { method: "app.info" },
            profile: { method: "profile" },
            userFieldTypeList: { method: "userfieldtype.list" },
            placementList: { method: "placement.get" },
          });
          stepsData.init = response.getData() as unknown as InitData;
        },
      },
      demo: {
        caption: "Preparing demo data...",
        action: async () => {
          await sleepAction(1000);
        },
      },
      placement: {
        caption: "Registering placements...",
        action: async () => {
          const key = {
            placement: "CRM_DEAL_DETAIL_TAB",
            handler: `${appUrl}/handler/placement-crm-deal-detail-tab`,
          };
          const placementList = stepsData.init?.placementList;
          const exists = placementList?.some(
            (item) =>
              item.placement === key.placement && item.handler === key.handler,
          );

          if (exists) {
            await $b24.callBatch([
              {
                method: "placement.unbind",
                params: { PLACEMENT: key.placement },
              },
              {
                method: "placement.bind",
                params: {
                  PLACEMENT: key.placement,
                  HANDLER: key.handler,
                  TITLE: "[demo] Some Tab",
                  OPTIONS: {
                    errorHandlerUrl: `${appUrl}/handler/background-some-problem`,
                  },
                },
              },
            ]);
            return;
          }

          await $b24.callBatch([
            {
              method: "placement.bind",
              params: {
                PLACEMENT: key.placement,
                HANDLER: key.handler,
                TITLE: "[demo] Some Tab",
                OPTIONS: {
                  errorHandlerUrl: `${appUrl}/handler/background-some-problem`,
                },
              },
            },
          ]);
        },
      },
      userFields: {
        caption: "Registering user field types...",
        action: async () => {
          const typeId = `some_type_${import.meta.env.DEV ? "dev" : "prod"}`;
          const userFieldTypeList = stepsData.init?.userFieldTypeList;
          const exists = userFieldTypeList?.some(
            (item) => item.USER_TYPE_ID === typeId,
          );

          const params = {
            USER_TYPE_ID: typeId,
            HANDLER: `${appUrl}/handler/uf.demo`,
            TITLE: `[${import.meta.env.DEV ? "dev" : "prod"}] Some Type`,
            DESCRIPTION: "Some Description",
            OPTIONS: { height: 105 },
          };

          if (exists) {
            await $b24.callBatch(
              [{ method: "userfieldtype.update", params }],
              false,
            );
            return;
          }

          await $b24.callBatch(
            [{ method: "userfieldtype.add", params }],
            false,
          );
        },
      },
      serverSide: {
        caption: "Configuring server...",
        action: async () => {
          const authData = $b24.auth.getAuthData();
          if (authData === false) {
            throw new Error("Auth data unavailable. Check app logic.");
          }

          const domain = authData.domain
            .replace("https://", "")
            .replace("http://", "")
            .replace(/\/$/, "");

          await postInstall("", {
            DOMAIN: domain,
            PROTOCOL: authData.domain.includes("https://") ? 1 : 0,
            LICENSE: stepsData.init?.appInfo?.LICENSE,
            LICENSE_FAMILY: stepsData.init?.appInfo?.LICENSE_FAMILY,
            LANG: $b24.getLang(),
            APP_SID: $b24.getAppSid(),
            AUTH_ID: authData.access_token,
            AUTH_EXPIRES: authData.expires_in,
            REFRESH_ID: authData.refresh_token,
            REFRESH_TOKEN: authData.refresh_token,
            member_id: authData.member_id,
            user_id: Number(stepsData.init?.profile?.ID),
            status: stepsData.init?.appInfo?.STATUS,
            appVersion: Number(stepsData.init?.appInfo?.VERSION),
            appCode: stepsData.init?.appInfo?.CODE,
            appId: Number(stepsData.init?.appInfo?.ID),
            PLACEMENT: $b24.placement.title,
            PLACEMENT_OPTIONS: $b24.placement.options,
          });
        },
      },
      finish: {
        caption: "Done!",
        action: async () => {
          setProgressColor("green");
          setProgress(100);
          await sleepAction(3000);
          await $b24.installFinish();
        },
      },
    };

    try {
      await $b24.parent.setTitle("Install");

      for (const [key, step] of Object.entries(steps)) {
        setCurrentStep(key);
        logger.info(`Step: ${key}`);
        await step.action();
      }
    } catch (err: unknown) {
      logger.error(err);
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  const caption =
    currentStep === "init"
      ? "Initializing..."
      : currentStep === "demo"
        ? "Preparing demo data..."
        : currentStep === "placement"
          ? "Registering placements..."
          : currentStep === "userFields"
            ? "Registering user field types..."
            : currentStep === "serverSide"
              ? "Configuring server..."
              : currentStep === "finish"
                ? "Done!"
                : "...";

  return (
    <div className="mx-3 flex flex-col items-center justify-center gap-1 h-dvh">
      <div className="size-[208px] flex items-center justify-center">
        <svg
          className={`size-32 ${currentStep === "finish" ? "text-green-500" : "text-green-300"}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.5}
          role="img"
          aria-label="Installation progress"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m4.5 12.75 6 6 9-13.5"
          />
        </svg>
      </div>

      <div className="w-1/2 sm:w-1/3 h-1 rounded-full bg-gray-200 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            progressColor === "green" ? "bg-green-500" : "bg-blue-500"
          }`}
          style={{ width: progress != null ? `${progress}%` : "60%" }}
        />
      </div>

      <div className="mt-6 flex flex-col items-center justify-center gap-2">
        <h1 className="text-2xl font-semibold text-gray-900 text-nowrap">
          Installing Application
        </h1>
        <p className="text-sm text-gray-500">{caption}</p>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4 max-w-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
    </div>
  );
}
