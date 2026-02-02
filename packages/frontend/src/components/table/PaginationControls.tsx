import { cn } from "../../lib/utils.js";

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100, 250, 500] as const;

interface PaginationControlsProps {
  pageIndex: number;
  pageCount: number;
  totalCount: number;
  pageSize: number;
  onPageChange: (pageIndex: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
  className?: string;
}

export function PaginationControls({
  pageIndex,
  pageCount,
  totalCount,
  pageSize,
  onPageChange,
  onPageSizeChange,
  disabled = false,
  className,
}: PaginationControlsProps) {
  const start = totalCount === 0 ? 0 : pageIndex * pageSize + 1;
  const end = Math.min((pageIndex + 1) * pageSize, totalCount);

  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-600",
        className
      )}
    >
      <div className="flex items-center gap-4">
        <span>
          Showing{" "}
          <strong>
            {start}–{end}
          </strong>{" "}
          of <strong>{totalCount.toLocaleString()}</strong>
        </span>
        <label className="flex items-center gap-2">
          <span>Rows per page</span>
          <select
            value={pageSize}
            onChange={(e) => {
              const v = Number(e.target.value);
              onPageSizeChange(v);
              onPageChange(0);
            }}
            disabled={disabled}
            className="rounded border border-gray-300 px-2 py-1 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            aria-label="Rows per page"
          >
            {PAGE_SIZE_OPTIONS.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={disabled || pageIndex <= 0}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Previous page"
        >
          Previous
        </button>
        <span className="px-2">
          Page <strong>{pageIndex + 1}</strong> of{" "}
          <strong>{Math.max(1, pageCount)}</strong>
        </span>
        <button
          type="button"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={disabled || pageIndex >= pageCount - 1 || pageCount <= 0}
          className="rounded border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
          aria-label="Next page"
        >
          Next
        </button>
      </div>
    </div>
  );
}
