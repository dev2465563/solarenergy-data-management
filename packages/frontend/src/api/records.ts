import type {
  GetRecordsParams,
  GetRecordsResponse,
  SerializedRecord,
  UpdateRecordBody,
  UploadRecordsResponse,
} from "./types.js";
import { ApiError } from "./errors.js";
import { fetchApi } from "./client.js";

function buildQuery(params: GetRecordsParams): string {
  const entries = Object.entries(params).filter(
    ([, value]) =>
      value !== undefined && value !== null && value !== ""
  ) as [string, string][];
  const stringEntries = entries.map(([key, value]) => [key, String(value)]);
  if (stringEntries.length === 0) return "";
  return "?" + new URLSearchParams(stringEntries).toString();
}

export async function getRecords(
  params: GetRecordsParams = {}
): Promise<GetRecordsResponse> {
  return fetchApi<GetRecordsResponse>(`/api/records${buildQuery(params)}`);
}

export async function getRecord(
  id: string,
  opts: { includeDeleted?: boolean } = {}
): Promise<SerializedRecord & { version?: string }> {
  const query = opts.includeDeleted ? "?includeDeleted=true" : "";
  return fetchApi<SerializedRecord & { version?: string }>(
    `/api/records/${encodeURIComponent(id)}${query}`
  );
}

export type UploadRecordsOptions = {
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
};

/** XHR for progress + abort. */
export function uploadRecords(
  file: File,
  options: UploadRecordsOptions = {}
): Promise<UploadRecordsResponse> {
  const { onProgress, signal } = options;
  const base = (import.meta.env.VITE_API_URL ?? "").replace(/\/$/, "");
  const url = base ? `${base}/api/records/upload` : "/api/records/upload";

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append("file", file);

    if (signal?.aborted) {
      reject(new DOMException("Aborted", "AbortError"));
      return;
    }

    const handleAbort = () => {
      xhr.abort();
    };
    signal?.addEventListener("abort", handleAbort);

    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) {
        onProgress?.(e.loaded, e.total);
      }
    });

    xhr.addEventListener("load", () => {
      signal?.removeEventListener("abort", handleAbort);
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.success && json.data) {
            resolve(json.data);
          } else {
            reject(new Error(json.message ?? "Upload failed"));
          }
        } catch {
          reject(new Error("Invalid response"));
        }
      } else {
        let message = "Upload failed";
        let code = "UPLOAD_FAILED";
        let details: unknown;
        try {
          const err = JSON.parse(xhr.responseText);
          message = err.message ?? err.error ?? message;
          code = err.code ?? code;
          details = err.details;
        } catch {}
        reject(new ApiError(xhr.status, code, details, message));
      }
    });

    xhr.addEventListener("error", () => {
      signal?.removeEventListener("abort", handleAbort);
      reject(new Error("Network error"));
    });

    xhr.addEventListener("abort", () => {
      signal?.removeEventListener("abort", handleAbort);
      reject(new DOMException("Aborted", "AbortError"));
    });

    xhr.open("POST", url);
    xhr.withCredentials = true;
    xhr.setRequestHeader("Accept", "application/json");
    xhr.send(formData);
  });
}

export async function updateRecord(
  id: string,
  etag: string,
  body: UpdateRecordBody
): Promise<SerializedRecord & { version?: string }> {
  const normalizedEtag =
    etag.startsWith('"') && etag.endsWith('"') ? etag : `"${etag}"`;

  return fetchApi<SerializedRecord & { version?: string }>(
    `/api/records/${encodeURIComponent(id)}`,
    {
      method: "PUT",
      headers: { "If-Match": normalizedEtag },
      body: JSON.stringify(body),
    }
  );
}

export async function deleteRecord(id: string): Promise<void> {
  await fetchApi<void>(`/api/records/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
