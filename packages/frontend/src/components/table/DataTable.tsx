import { useMemo, useRef, useState, useEffect } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type SortingState,
  type Row,
} from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { SerializedRecord } from "../../api/types.js";
import { getBaseColumns, getDeviceColumns, getActionColumn } from "../../lib/table-utils.js";
import { cn } from "../../lib/utils.js";
import { EditableCell } from "./EditableCell.js";
import { ActionsCell } from "./ActionsCell.js";

const ROW_HEIGHT = 41;
const VIRTUAL_OVERSCAN = 5;
const TIMESTAMP_WIDTH = 180;
const ACTIONS_WIDTH = 80;

interface DataTableProps {
  data: SerializedRecord[];
  devices: string[];
  onDelete: (rowId: string) => void;
  isDeleting?: boolean;
}

function useScrollShadows(tableContentKey: number) {
  const ref = useRef<HTMLDivElement>(null);
  const [shadows, setShadows] = useState({ left: false, right: false });

  const update = () => {
    const el = ref.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const hasOverflow = scrollWidth > clientWidth;
    setShadows({
      left: hasOverflow && scrollLeft > 0,
      right: hasOverflow && scrollLeft < scrollWidth - clientWidth - 1,
    });
  };

  useEffect(() => {
    update();
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(update);
    ro.observe(el);
    el.addEventListener("scroll", update);
    return () => {
      ro.disconnect();
      el.removeEventListener("scroll", update);
    };
  }, [tableContentKey]);

  return { ref, shadows };
}

export function DataTable({
  data,
  devices,
  onDelete,
  isDeleting = false,
}: DataTableProps) {
  const { ref: scrollRef, shadows } = useScrollShadows(data.length + devices.length);

  const columns = useMemo(() => {
    const renderDeviceCell = (
      row: { original: SerializedRecord },
      deviceId: string,
      value: number | null
    ) => (
      <EditableCell
        rowId={row.original.id}
        device={deviceId}
        initialValue={value}
      />
    );

    return [
      ...getBaseColumns(),
      ...getDeviceColumns(devices, renderDeviceCell),
      getActionColumn((row) => (
        <ActionsCell row={row} onDelete={onDelete} isDeleting={isDeleting} />
      )),
    ];
  }, [devices, onDelete, isDeleting]);

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    initialState: { sorting: [] as SortingState },
  });

  const rows = table.getRowModel().rows;
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scrollRef.current,
    estimateSize: () => ROW_HEIGHT,
    overscan: VIRTUAL_OVERSCAN,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();

  return (
    <div className="relative flex min-h-0 flex-1 flex-col">
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 overflow-auto rounded-lg border border-gray-200 bg-white"
      >
        <table className="w-full min-w-full divide-y divide-gray-200 text-left text-sm" style={{ display: "grid" }}>
          <thead className="sticky top-0 z-20 bg-gray-50 shadow-sm" style={{ display: "grid" }}>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} style={{ display: "flex", width: "100%" }}>
                {headerGroup.headers.map((header) => {
                  const colId = header.column.id;
                  const isTimestamp = colId === "timestamp";
                  const isActions = colId === "actions";
                  const pinnedLeft = isTimestamp;
                  const pinnedRight = isActions;
                  const flexStyle = isTimestamp
                    ? { flex: `0 0 ${TIMESTAMP_WIDTH}px`, minWidth: TIMESTAMP_WIDTH }
                    : isActions
                      ? { flex: `0 0 ${ACTIONS_WIDTH}px`, minWidth: ACTIONS_WIDTH }
                      : { flex: "1 1 0", minWidth: 70 };
                  return (
                  <th
                    key={header.id}
                    style={{
                      display: "flex",
                      ...flexStyle,
                      ...(pinnedLeft && {
                        position: "sticky",
                        left: 0,
                        zIndex: 21,
                        boxShadow: "4px 0 12px -2px rgba(0,0,0,0.12)",
                        borderRight: "1px solid rgb(209 213 219)",
                      }),
                      ...(pinnedRight && {
                        position: "sticky",
                        right: 0,
                        zIndex: 21,
                        boxShadow: "-4px 0 12px -2px rgba(0,0,0,0.12)",
                        borderLeft: "1px solid rgb(209 213 219)",
                      }),
                    }}
                    className={cn(
                      "px-4 py-2 font-medium text-gray-700 whitespace-nowrap bg-gray-50",
                      (pinnedLeft || pinnedRight) && "!bg-gray-200"
                    )}
                    scope="col"
                  >
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody
            className="divide-y divide-gray-100"
            style={{
              display: "grid",
              height: `${rowVirtualizer.getTotalSize()}px`,
              position: "relative",
            }}
          >
            {virtualRows.map((virtualRow) => {
              const row = rows[virtualRow.index] as Row<SerializedRecord>;
              return (
                <tr
                  key={row.id}
                  className="group hover:bg-gray-50/50"
                  style={{
                    display: "flex",
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    transform: `translateY(${virtualRow.start}px)`,
                    height: `${virtualRow.size}px`,
                  }}
                >
                  {row.getVisibleCells().map((cell) => {
                    const colId = cell.column.id;
                    const isTimestamp = colId === "timestamp";
                    const isActions = colId === "actions";
                    const pinnedLeft = isTimestamp;
                    const pinnedRight = isActions;
                    const flexStyle = isTimestamp
                      ? { flex: `0 0 ${TIMESTAMP_WIDTH}px`, minWidth: TIMESTAMP_WIDTH }
                      : isActions
                        ? { flex: `0 0 ${ACTIONS_WIDTH}px`, minWidth: ACTIONS_WIDTH }
                        : { flex: "1 1 0", minWidth: 70 };
                    return (
                    <td
                      key={cell.id}
                      style={{
                        display: "flex",
                        ...flexStyle,
                        ...(pinnedLeft && {
                          position: "sticky",
                          left: 0,
                          zIndex: 1,
                          boxShadow: "4px 0 12px -2px rgba(0,0,0,0.12)",
                          borderRight: "1px solid rgb(209 213 219)",
                        }),
                        ...(pinnedRight && {
                          position: "sticky",
                          right: 0,
                          zIndex: 1,
                          boxShadow: "-4px 0 12px -2px rgba(0,0,0,0.12)",
                          borderLeft: "1px solid rgb(209 213 219)",
                        }),
                      }}
                      className={cn(
                        "px-4 py-2 text-gray-900 whitespace-nowrap",
                        (pinnedLeft || pinnedRight) && "bg-gray-100 group-hover:bg-gray-200"
                      )}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {shadows.left && (
        <div
          className="pointer-events-none absolute left-0 top-0 bottom-0 w-6 bg-gradient-to-r from-gray-100 to-transparent z-10 rounded-l-lg"
          aria-hidden
        />
      )}
      {shadows.right && (
        <div
          className="pointer-events-none absolute right-0 top-0 bottom-0 w-6 bg-gradient-to-l from-gray-100 to-transparent z-10 rounded-r-lg"
          aria-hidden
        />
      )}
    </div>
  );
}
