import axios from "axios";

import type {ApiErrorResponse, ApiValidationError} from "@/types/api";

export type ErrorTranslationKey =
  | "networkError"
  | "invalidCredentials"
  | "accountUnavailable"
  | "unauthenticated"
  | "forbidden"
  | "notFound"
  | "validationError"
  | "serverError"
  | "unexpectedError";

export type ErrorContext = "login" | "request";

export interface NormalizedApiError {
  status?: number;
  code?: string;
  message?: string;
  fieldErrors: Record<string, string>;
  translationKey: ErrorTranslationKey;
}

function getFieldErrors(errors: ApiValidationError[] | undefined) {
  if (!Array.isArray(errors)) return {};

  return errors.reduce<Record<string, string>>((result, item) => {
    if (typeof item.field === "string" && typeof item.message === "string" && !result[item.field]) {
      result[item.field] = item.message;
    }
    return result;
  }, {});
}

function getTranslationKey(
  status: number,
  context: ErrorContext,
): ErrorTranslationKey {
  if (status === 401) return context === "login" ? "invalidCredentials" : "unauthenticated";
  if (status === 403) return context === "login" ? "accountUnavailable" : "forbidden";
  if (status === 404) return "notFound";
  if (status === 400 || status === 409 || status === 422) return "validationError";
  if (status >= 500) return "serverError";
  return "unexpectedError";
}

export function normalizeApiError(
  error: unknown,
  context: ErrorContext = "request",
): NormalizedApiError {
  if (!axios.isAxiosError<ApiErrorResponse>(error)) {
    return {fieldErrors: {}, translationKey: "unexpectedError"};
  }

  if (!error.response) {
    return {code: error.code, fieldErrors: {}, translationKey: "networkError"};
  }

  const {status, data} = error.response;
  const nestedCode = typeof data?.error === "string"
    ? data.error
    : data?.error && typeof data.error === "object"
      ? data.error.code
      : undefined;

  return {
    status,
    code: data?.code ?? nestedCode,
    message: typeof data?.message === "string" && status < 500 ? data.message : undefined,
    fieldErrors: getFieldErrors(data?.errors),
    translationKey: getTranslationKey(status, context),
  };
}
