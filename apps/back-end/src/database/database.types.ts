import type { ApplicationInstallation, Bitrix24Account } from "@/entities";

export interface Database {
  bitrix24account: Bitrix24Account;
  application_installation: ApplicationInstallation;
}
