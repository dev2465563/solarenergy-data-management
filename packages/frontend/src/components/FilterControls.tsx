import type { GetRecordsParams } from "../api/types.js";
import { cn } from "../lib/utils.js";

export type ViewMode = "wide" | "selected";

interface FilterControlsProps {
  value: GetRecordsParams;
  onChange: (params: GetRecordsParams) => void;
  disabled?: boolean;
  className?: string;
  /** Shows View dropdown when many devices. */
  viewMode?: ViewMode;
  onViewModeChange?: (mode: ViewMode) => void;
  deviceCount?: number;
  selectedDeviceCount?: number;
  onOpenDeviceSelector?: () => void;
}

export function FilterControls({
  value,
  onChange,
  disabled = false,
  className,
  viewMode = "wide",
  onViewModeChange,
  deviceCount = 0,
  selectedDeviceCount = 0,
  onOpenDeviceSelector,
}: FilterControlsProps) {
  const update = (partial: Partial<GetRecordsParams>) => {
    onChange({ ...value, ...partial });
  };

  const showViewDropdown = deviceCount > 0 && onViewModeChange != null;

  return (
    <div
      className={cn(
        "flex flex-wrap items-end gap-4 rounded-lg border border-gray-200 bg-white p-4",
        className
      )}
    >
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">Start</span>
        <input
          type="datetime-local"
          value={value.start ?? ""}
          onChange={(e) => update({ start: e.target.value || undefined })}
          disabled={disabled}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Start date and time"
        />
      </label>
      <label className="flex flex-col gap-1">
        <span className="text-sm font-medium text-gray-700">End</span>
        <input
          type="datetime-local"
          value={value.end ?? ""}
          onChange={(e) => update({ end: e.target.value || undefined })}
          disabled={disabled}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="End date and time"
        />
      </label>

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={value.includeDeleted ?? false}
          onChange={(e) => update({ includeDeleted: e.target.checked })}
          disabled={disabled}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <span className="text-sm text-gray-700">Include deleted</span>
      </label>

      {/* View controls (right) - Devices button always visible to avoid layout shift */}
      {showViewDropdown && (
        <div className="flex items-end gap-4 ml-auto">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">View</span>
            <select
              value={viewMode}
              onChange={(e) =>
                onViewModeChange?.(e.target.value as ViewMode)
              }
              disabled={disabled}
              className="rounded border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 min-w-[10rem]"
              aria-label="Table view mode"
            >
              <option value="wide">All devices ({deviceCount})</option>
              <option value="selected">Selected devices</option>
            </select>
          </label>
          <button
            type="button"
            onClick={onOpenDeviceSelector}
            disabled={disabled || viewMode !== "selected"}
            className={cn(
              "rounded border px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 min-w-[8rem]",
              viewMode === "selected"
                ? "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                : "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            )}
            aria-label="Select devices to show in table"
            aria-disabled={viewMode !== "selected"}
            title={
              viewMode === "selected"
                ? "Choose which device columns appear in the table"
                : "Switch to Selected devices to choose columns"
            }
          >
            Devices ({viewMode === "selected" ? selectedDeviceCount : deviceCount} of {deviceCount})
          </button>
        </div>
      )}
    </div>
  );
}
