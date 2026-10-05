import "server-only";

import axios from "axios";

import type {ApiErrorResponse, ApiValidationError} from "@/types/api";

interface BackendErrorResult {
  status: number;
  body: ApiErrorResponse;
}

const TECHNICAL_MESSAGE_PATTERNS = [
  /request failed with status code/i,
  /stack trace/i,
  /supabase/i,
  /postgres|postgresql|sqlstate/i,
  /internal server error/i,
  /ECONN|ENOTFOUND|ETIMEDOUT/i,
];

interface UpstreamErrorResponse {
  status: number;
  data?: unknown;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function isErrorStatus(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 400 && value <= 599;
}

/**
 * Axios errors can be wrapped by a server/runtime boundary. Keep the response
 * information when that happens instead of treating a valid upstream 4xx as an
 * unexpected proxy failure.
 */
function getUpstreamResponse(error: unknown): UpstreamErrorResponse | undefined {
  const candidates: unknown[] = [error];
  const seen = new Set<object>();

  while (candidates.length) {
    const candidate = candidates.shift();
    if (!isRecord(candidate) || seen.has(candidate)) continue;
    seen.add(candidate);

    if (axios.isAxiosError(candidate) && candidate.response && isErrorStatus(candidate.response.status)) {
      return {status: candidate.response.status, data: candidate.response.data};
    }

    const response = candidate.response;
    if (isRecord(response) && isErrorStatus(response.status)) {
      return {status: response.status, data: response.data};
    }

    if (candidate.cause) candidates.push(candidate.cause);
  }

  return undefined;
}

function isSafeMessage(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const message = value.trim();

  return (
    message.length > 0 &&
    message.length <= 240 &&
    !TECHNICAL_MESSAGE_PATTERNS.some((pattern) => pattern.test(message))
  );
}

function sanitizeValidationErrors(value: unknown): ApiValidationError[] | undefined {
  if (!Array.isArray(value)) return undefined;

  const errors = value.flatMap<ApiValidationError>((item) => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (!isSafeMessage(candidate.message)) return [];

    return [{
      field: typeof candidate.field === "string" ? candidate.field : undefined,
      code: typeof candidate.code === "string" ? candidate.code : undefined,
      message: candidate.message.trim(),
    }];
  });

  return errors.length ? errors : undefined;
}

function getCode(data: unknown) {
  if (!isRecord(data)) return undefined;

  const nestedError = isRecord(data.error) ? data.error : undefined;
  const nestedDetail = isRecord(data.detail) ? data.detail : undefined;
  const validationErrors = Array.isArray(data.errors) ? data.errors : undefined;
  const candidates = [
    data.code,
    data.error_code,
    data.errorCode,
    nestedError?.code,
    nestedError?.error_code,
    nestedDetail?.code,
    validationErrors?.find(isRecord)?.code,
    typeof data.error === "string" ? data.error : undefined,
  ];

  for (const candidate of candidates) {
    if (typeof candidate === "string" && /^[A-Z][A-Z0-9_]*$/.test(candidate)) return candidate;
  }

  return undefined;
}

function getMessage(data: unknown) {
  if (!isRecord(data)) return undefined;

  const nestedError = isRecord(data.error) ? data.error : undefined;
  const nestedDetail = isRecord(data.detail) ? data.detail : undefined;
  const candidates = [data.message, nestedError?.message, nestedDetail?.message];

  return candidates.find(isSafeMessage)?.trim();
}

function getValidationErrors(data: unknown) {
  if (!isRecord(data)) return undefined;

  const nestedError = isRecord(data.error) ? data.error : undefined;
  return sanitizeValidationErrors(data.errors ?? nestedError?.errors);
}

export function normalizeBackendError(
  error: unknown,
  fallbackMessage: string,
): BackendErrorResult {
  const response = getUpstreamResponse(error);
  if (!response) {
    return {
      status: axios.isAxiosError(error) ? 502 : 500,
      body: {message: fallbackMessage},
    };
  }

  const {status, data} = response;
  const code = getCode(data);

  if (status >= 500) {
    return {
      status,
      body: {message: fallbackMessage, ...(code ? {code} : {})},
    };
  }

  const message = getMessage(data) ?? fallbackMessage;
  const errors = getValidationErrors(data);

  return {
    status,
    body: {message, ...(code ? {code} : {}), ...(errors ? {errors} : {})},
  };
}
