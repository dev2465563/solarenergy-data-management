export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
export const LARGE_FILE_WARNING_BYTES = 5 * 1024 * 1024;

const CSV_MIME_TYPES = ["text/csv", "application/csv", "text/plain"];
const CSV_EXTENSION = ".csv";

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function isCsvFile(file: File): boolean {
  const name = file.name?.toLowerCase() ?? "";
  const type = (file.type ?? "").toLowerCase();
  const hasCsvExt = name.endsWith(CSV_EXTENSION);
  const hasCsvMime = CSV_MIME_TYPES.some((m) => type.includes(m) || type === "");
  return hasCsvExt || hasCsvMime;
}

export type CsvValidationResult =
  | { valid: true }
  | { valid: false; message: string; code: string };

export function validateCsvFile(file: File): CsvValidationResult {
  if (!isCsvFile(file)) {
    return {
      valid: false,
      message: "Please upload a CSV file (.csv).",
      code: "INVALID_FILE_TYPE",
    };
  }
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      valid: false,
      message: `File is too large (max ${formatFileSize(MAX_FILE_SIZE_BYTES)}).`,
      code: "FILE_TOO_LARGE",
    };
  }
  return { valid: true };
}

export function isLargeFile(file: File): boolean {
  return file.size > LARGE_FILE_WARNING_BYTES;
}

/** Backend error codes → user messages. */
export function getUploadErrorMessage(
  message: string,
  code?: string,
  _details?: unknown
): string {
  switch (code) {
    case "INVALID_CSV":
    case "INVALID_CSV_HEADER":
      return message || "Invalid CSV: check that the file has a 'timestamp' column and valid device columns.";
    case "MISSING_FILE":
      return "No file was selected. Please choose a CSV file.";
    case "INVALID_FILE_TYPE":
      return "Please upload a CSV file (.csv).";
    case "FILE_TOO_LARGE":
      return `File is too large (max ${formatFileSize(MAX_FILE_SIZE_BYTES)}).`;
    case "TIMEOUT":
      return "Upload timed out. Try a smaller file or check your connection.";
    case "FETCH_FAILED":
      return "Network error. Check your connection and try again.";
    default:
      return message || "Upload failed. Please try again.";
  }
}
