import { cn } from "../../lib/utils.js";

interface UploadProgressProps {
  progress: number;
  fileName: string;
  onCancel?: () => void;
  className?: string;
}

export function UploadProgress({
  progress,
  fileName,
  onCancel,
  className,
}: UploadProgressProps) {
  return (
    <div className={cn("space-y-3", className)} aria-live="polite">
      <div className="flex items-center justify-between gap-2">
        <p className="text-sm font-medium text-gray-700">
          Uploading {fileName}…
        </p>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="shrink-0 rounded border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Cancel
          </button>
        )}
      </div>
      <div
        className="h-2.5 w-full rounded-full bg-gray-200 overflow-hidden"
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Upload progress"
      >
        <div
          className="h-full rounded-full bg-blue-600 transition-all duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="text-xs text-gray-500">{progress}%</p>
    </div>
  );
}
