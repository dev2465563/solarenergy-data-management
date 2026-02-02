import type { ApiErrorResponse } from "./types.js";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string = "UNKNOWN_ERROR",
    public readonly details?: unknown,
    message?: string,
    public readonly response?: Response
  ) {
    super(message ?? `API error ${status} (${code})`);
    this.name = "ApiError";
    Object.setPrototypeOf(this, ApiError.prototype);
  }

  static fromResponse(
    res: Response,
    body?: ApiErrorResponse | null
  ): ApiError {
    const message = body?.message ?? (res.statusText || `Request failed (${res.status})`);
    const code = body?.code ?? (res.status >= 500 ? "SERVER_ERROR" : "CLIENT_ERROR");
    return new ApiError(res.status, code, body?.details, message, res);
  }

  isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  isServerError(): boolean {
    return this.status >= 500;
  }

  isNetworkError(): boolean {
    return this.status === 0;
  }
}
