import { AjaxError } from "@bitrix24/b24jssdk";
import type { ProcessErrorData } from "../types.js";

export type { ProcessErrorData };

export interface B24Error {
  statusCode: number;
  statusMessage: string;
  message: string;
  data?: ProcessErrorData;
  cause?: unknown;
}

export function classifyError(
  error: unknown,
  processErrorData?: ProcessErrorData,
): B24Error {
  let statusMessage = "Error";
  let message = "";
  let statusCode = 404;

  if (error instanceof AjaxError) {
    statusCode = error.status;
    statusMessage = error.name;
    message = error.message;
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = String(error);
  }

  return {
    statusCode,
    statusMessage,
    message,
    data: processErrorData ? { ...processErrorData } : undefined,
    cause: error,
  };
}
