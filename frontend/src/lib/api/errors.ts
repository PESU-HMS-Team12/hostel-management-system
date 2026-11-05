import type { ApiErrorResponse, ValidationErrors } from "../types/hms";

export class HmsApiError extends Error {
  public readonly statusCode: number;
  public readonly fieldErrors: ValidationErrors;

  constructor(
    message: string,
    statusCode: number = 400,
    fieldErrors: ValidationErrors = {}
  ) {
    super(message);
    this.name = "HmsApiError";
    this.statusCode = statusCode;
    this.fieldErrors = fieldErrors;
  }
}

export function normalizeBackendError(
  payload: unknown,
  fallbackStatus: number = 500
): HmsApiError {
  if (payload && typeof payload === "object") {
    const data = payload as Partial<ApiErrorResponse> & Record<string, unknown>;
    const statusCode =
      typeof data.status_code === "number" ? data.status_code : fallbackStatus;
    const fieldErrors: ValidationErrors = {};

    const detailsSource =
      data.details && typeof data.details === "object"
        ? (data.details as Record<string, unknown>)
        : data;

    for (const [key, value] of Object.entries(detailsSource)) {
      if (key === "error" || key === "status_code" || key === "details") {
        continue;
      }
      if (Array.isArray(value) && value.length > 0) {
        fieldErrors[key] = String(value[0]);
      } else if (typeof value === "string") {
        fieldErrors[key] = value;
      }
    }

    const firstFieldError = Object.values(fieldErrors)[0];
    const message =
      (typeof data.error === "string" && data.error !== "Validation failed."
        ? data.error
        : firstFieldError ||
          (typeof data.error === "string" ? data.error : null)) ||
      "Request could not be completed.";

    return new HmsApiError(message, statusCode, fieldErrors);
  }

  return new HmsApiError(
    "Unable to reach the HMS backend service.",
    fallbackStatus
  );
}
