export interface ApiValidationError {
  field?: string;
  code?: string;
  message?: string;
}

export interface ApiErrorDetails {
  code?: string;
}

export interface ApiErrorResponse {
  message?: string;
  code?: string;
  errors?: ApiValidationError[];
  error?: string | ApiErrorDetails;
}
