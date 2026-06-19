export type {
  AuthData,
  B24Frame,
  TypeEnumAppStatus,
} from "@bitrix24/b24jssdk";

export interface IStep {
  action: () => Promise<void>;
  caption?: string;
  data?: Record<string, unknown>;
}

export interface B24InitConfig {
  apiBaseUrl: string;
  isDev?: boolean;
}

export interface ProcessErrorData {
  description?: string;
  isShowClearError?: boolean;
  clearErrorHref?: string;
  clearErrorTitle?: string;
  homePageIsHide?: boolean;
  homePageHref?: string;
  homePageTitle?: string;
}
