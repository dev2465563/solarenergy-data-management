import { ApiError } from "./errors.js";
import type { ApiResponse, ApiErrorResponse } from "./types.js";

const BASE_URL = import.meta.env.VITE_API_URL ?? "";
const DEFAULT_TIMEOUT_MS = 30_000;

export type FetchApiOptions = RequestInit & { timeoutMs?: number };

export async function fetchApi<T>(
  endpoint: string,
  options: FetchApiOptions = {}
): Promise<T> {
  const { timeoutMs = DEFAULT_TIMEOUT_MS, ...fetchOptions } = options;

  const url = endpoint.startsWith("http")
    ? endpoint
    : `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const isFormData = fetchOptions.body instanceof FormData;
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(fetchOptions.headers as Record<string, string>),
  };
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const res = await fetch(url, {
      ...fetchOptions,
      credentials: "include",
      signal: controller.signal,
      headers,
    });

    clearTimeout(timeoutId);

    let json: ApiResponse<T> | ApiErrorResponse | undefined;

    if (res.status !== 204) {
      try {
        const text = await res.text();
        json = text ? (JSON.parse(text) as ApiResponse<T> | ApiErrorResponse) : undefined;
      } catch {
        throw new ApiError(
          res.status,
          "INVALID_JSON",
          undefined,
          "Failed to parse response",
          res
        );
      }
    }

    if (!res.ok) {
      const errBody = json as ApiErrorResponse | undefined;
      throw ApiError.fromResponse(res, errBody ?? null);
    }

    if (res.status === 204) {
      return undefined as T;
    }

    return (json as ApiResponse<T>).data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);

    if (err instanceof ApiError) throw err;

    if (err instanceof Error && err.name === "AbortError") {
      throw new ApiError(
        0,
        "TIMEOUT",
        undefined,
        `Request timed out after ${timeoutMs}ms`
      );
    }

    throw new ApiError(
      0,
      "FETCH_FAILED",
      undefined,
      err instanceof Error ? err.message : "Network failure"
    );
  }
}
