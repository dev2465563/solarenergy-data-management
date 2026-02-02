import { useRef, useState, useEffect } from "react";
import { cn } from "../../lib/utils.js";
import { useUpload } from "../../hooks/useUpload.js";
import { ApiError } from "../../api/errors.js";
import {
  validateCsvFile,
  isLargeFile,
  formatFileSize,
  MAX_FILE_SIZE_BYTES,
  getUploadErrorMessage,
} from "../../lib/upload-utils.js";
import { UploadProgress } from "./UploadProgress.js";

const CSV_ACCEPT = ".csv,text/csv,application/csv,text/plain";

export type UploadZoneProps = {
  onSuccess?: () => void;
};

export function UploadZone({ onSuccess }: UploadZoneProps = {}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [rejectionMessage, setRejectionMessage] = useState<string | null>(null);
  const [largeFileWarning, setLargeFileWarning] = useState(false);

  const {
    mutate,
    progress,
    fileName,
    isUploading,
    error,
    reset,
    abort,
    isSuccess,
    data,
  } = useUpload({ onSuccess });

  useEffect(() => {
    if (!fileName) setLargeFileWarning(false);
  }, [fileName]);

  const handleFile = (file: File | null) => {
    setRejectionMessage(null);
    if (!file) return;

    const validation = validateCsvFile(file);
    if (!validation.valid) {
      setRejectionMessage(validation.message);
      return;
    }

    setLargeFileWarning(isLargeFile(file));
    mutate(file);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    handleFile(file ?? null);
    e.target.value = "";
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files?.[0] ?? null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const isAborted = error instanceof DOMException && error.name === "AbortError";
  const displayError =
    !isAborted &&
    (rejectionMessage ||
      (error instanceof ApiError
        ? getUploadErrorMessage(error.message, error.code, error.details)
        : error instanceof Error
          ? error.message
          : error != null
            ? String(error)
            : null));

  const hasError = !!displayError;
  const busy = isUploading;

  return (
    <div className="space-y-4" role="region" aria-label="Upload CSV">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !busy && inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors",
          dragOver && "border-blue-500 bg-blue-50",
          !dragOver && !hasError && "border-gray-300 bg-gray-50 hover:border-gray-400",
          hasError && "border-red-300 bg-red-50",
          busy && "cursor-wait opacity-90",
          !busy && "cursor-pointer"
        )}
        aria-disabled={busy}
        aria-describedby={hasError ? "upload-error" : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept={CSV_ACCEPT}
          onChange={handleChange}
          disabled={busy}
          className="hidden"
          aria-label="Choose CSV file"
        />

        {isUploading ? (
          <UploadProgress
            progress={progress}
            fileName={fileName ?? ""}
            onCancel={abort}
          />
        ) : hasError ? (
          <div className="space-y-2 text-center">
            <p
              id="upload-error"
              className="text-sm font-medium text-red-700"
              role="alert"
            >
              {displayError}
            </p>
            <p className="text-xs text-gray-600">
              Supported: .csv • Max {formatFileSize(MAX_FILE_SIZE_BYTES)}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                reset();
                setRejectionMessage(null);
                setLargeFileWarning(false);
              }}
              className="mt-2 rounded border border-gray-300 bg-white px-3 py-1.5 text-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Try again
            </button>
          </div>
        ) : (
          <div className="space-y-2 text-center">
            <p className="text-sm font-medium text-gray-700">
              Drag & drop CSV here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supported: .csv • Max {formatFileSize(MAX_FILE_SIZE_BYTES)}
            </p>
          </div>
        )}
      </div>

      {fileName && !isUploading && !displayError && (
        <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-medium text-gray-800 truncate" title={fileName}>
              {fileName}
            </span>
            {isSuccess && data != null && (
              <span className="text-sm text-green-600 shrink-0">
                — {data.count} record(s) replaced
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              reset();
              setLargeFileWarning(false);
            }}
            className="shrink-0 rounded p-1 text-gray-500 hover:bg-gray-200 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Clear"
          >
            <span className="sr-only">Clear</span>
            <span aria-hidden>×</span>
          </button>
        </div>
      )}

      {!busy && (
        <div className="flex justify-center">
          <label className="cursor-pointer rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-1">
            <span>Select CSV file</span>
            <input
              type="file"
              accept={CSV_ACCEPT}
              onChange={handleChange}
              className="sr-only"
            />
          </label>
        </div>
      )}

      {largeFileWarning && (isUploading || fileName) && (
        <p className="text-xs text-amber-700" role="status">
          Large file detected — upload may take a while.
        </p>
      )}
    </div>
  );
}
