import type { ReactNode } from "react";
import {
  createColumnHelper,
  type ColumnDef,
  type Row,
} from "@tanstack/react-table";
import type { SerializedRecord } from "../api/types.js";
import { formatDate, formatEnergy } from "./formatters.js";

const columnHelper = createColumnHelper<SerializedRecord>();

export function getBaseColumns(): ColumnDef<SerializedRecord, string>[] {
  return [
    columnHelper.accessor("timestamp", {
      id: "timestamp",
      header: "Timestamp",
      size: 180,
      cell: ({ getValue }) => formatDate(getValue()),
      sortingFn: "datetime",
    }),
  ];
}

export type DeviceCellRenderer = (
  row: Row<SerializedRecord>,
  deviceId: string,
  value: number | null
) => ReactNode;

const DEVICE_COLUMN_MIN_SIZE = 70;

export function getDeviceColumns(
  devices: string[],
  renderCell?: DeviceCellRenderer
): ColumnDef<SerializedRecord, number | null>[] {
  return devices.map((device) =>
    columnHelper.accessor(
      (row) => row.outputs?.[device] ?? null,
      {
        id: device,
        header: device,
        size: DEVICE_COLUMN_MIN_SIZE,
        minSize: DEVICE_COLUMN_MIN_SIZE,
        cell: ({ getValue, row }) => {
          const value = getValue();
          if (renderCell) return renderCell(row, device, value);
          return formatEnergy(value);
        },
        meta: { device },
        enableSorting: true,
      }
    )
  );
}

export function getActionColumn(
  renderCell: (row: Row<SerializedRecord>) => ReactNode
): ColumnDef<SerializedRecord, void> {
  return columnHelper.display({
    id: "actions",
    header: "Actions",
    size: 80,
    cell: ({ row }) => renderCell(row),
    enableSorting: false,
  });
}
