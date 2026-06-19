import { postInstall, sleepAction } from "@common/bitrix";
import { createInstallPage } from "@/lib/create-install-page";

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
}

// To register placements (e.g. a CRM deal tab) or custom user-field types as
// install steps, see docs/front-end/installation.md for worked examples.
export const InstallPage = createInstallPage<{ init?: InitData }>({
  title: "install.title",
  fallbackCaption: "install.steps.fallback",
  initErrorCaption: "install.failedInit",
  steps: [
    {
      caption: "install.steps.init",
      action: async ({ $b24, store }) => {
        const response = await $b24.callBatch({
          appInfo: { method: "app.info" },
          profile: { method: "profile" },
        });
        store.init = response.getData() as unknown as InitData;
      },
    },
    {
      caption: "install.steps.serverSide",
      action: async ({ $b24, store }) => {
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
          LICENSE: store.init?.appInfo?.LICENSE,
          LICENSE_FAMILY: store.init?.appInfo?.LICENSE_FAMILY,
          LANG: $b24.getLang(),
          APP_SID: $b24.getAppSid(),
          AUTH_ID: authData.access_token,
          AUTH_EXPIRES: authData.expires_in,
          REFRESH_ID: authData.refresh_token,
          REFRESH_TOKEN: authData.refresh_token,
          member_id: authData.member_id,
          user_id: Number(store.init?.profile?.ID),
          status: store.init?.appInfo?.STATUS,
          appVersion: Number(store.init?.appInfo?.VERSION),
          appCode: store.init?.appInfo?.CODE,
          appId: Number(store.init?.appInfo?.ID),
          PLACEMENT: $b24.placement.title,
          PLACEMENT_OPTIONS: $b24.placement.options,
        });
      },
    },
    {
      caption: "install.steps.finish",
      action: async ({ $b24, setProgress, setProgressColor }) => {
        setProgressColor("green");
        setProgress(100);
        await sleepAction(3000);
        await $b24.installFinish();
      },
    },
  ],
});
