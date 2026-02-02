import { useMemo, useState, useEffect } from "react";
import { ApiError } from "../api/errors.js";
import { useRecordSearchParams } from "../hooks/useRecordSearchParams.js";
import { useRecords } from "../hooks/useRecords.js";
import { useDeleteRecord } from "../hooks/useRecordMutations.js";
import { DEVICE_SELECTOR_THRESHOLD } from "../lib/constants.js";
import { FilterControls, type ViewMode } from "./FilterControls.js";
import { DeviceSelector } from "./filters/DeviceSelector.js";
import { ManyDevicesSuggestion } from "./ui/ManyDevicesSuggestion.js";
import { Modal } from "./ui/Modal.js";
import { TotalEnergyDisplay } from "./summary/TotalEnergyDisplay.js";
import { DataTable } from "./table/DataTable.js";
import { PaginationControls } from "./table/PaginationControls.js";
import { TableSkeleton } from "./table/TableSkeleton.js";
import { WarningBanner } from "./ui/WarningBanner.js";
const DEFAULT_SELECTED_DEVICES = 10;
const LARGE_RESULT_SET_THRESHOLD = 5000;
const VIEW_MODE_STORAGE_KEY = "recordsViewMode";

export function RecordsView() {
  const [params, setParams] = useRecordSearchParams();
  const { data, isLoading, isFetching, error, refetch, pagination } = useRecords({
    params,
    setParams,
  });

  const deleteRecordMutation = useDeleteRecord();

  const deviceNames =
    data?.records?.length && data.records[0]?.outputs
      ? Object.keys(data.records[0].outputs)
      : [];

  const defaultSelected = useMemo(
    () => deviceNames.slice(0, DEFAULT_SELECTED_DEVICES),
    [deviceNames.join(",")]
  );

  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    try {
      const s = localStorage.getItem(VIEW_MODE_STORAGE_KEY);
      if (s === "wide" || s === "selected") return s;
    } catch {}
    return "wide";
  });

  const [selectedDevices, setSelectedDevices] = useState<string[]>(defaultSelected);
  const [deviceModalOpen, setDeviceModalOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(VIEW_MODE_STORAGE_KEY, viewMode);
    } catch {}
  }, [viewMode]);

  useEffect(() => {
    if (deviceNames.length <= DEVICE_SELECTOR_THRESHOLD) return;
    try {
      if (localStorage.getItem(VIEW_MODE_STORAGE_KEY) != null) return;
      setViewModeState("selected");
    } catch {}
  }, [deviceNames.length]);

  const setViewMode = (mode: ViewMode) => {
    setViewModeState(mode);
    if (mode === "selected") {
      setSelectedDevices((prev) => {
        const valid = prev.filter((d) => deviceNames.includes(d));
        return valid.length > 0 ? valid : defaultSelected;
      });
    }
  };

  const useSelectedView = viewMode === "selected";
  const visibleDevices = useSelectedView
    ? (() => {
        const valid = selectedDevices.filter((d) => deviceNames.includes(d));
        return valid.length > 0 ? valid : defaultSelected;
      })()
    : deviceNames;

  if (isLoading && !data) {
    return (
      <div className="space-y-4">
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    const message =
      error instanceof ApiError
        ? `${error.message}${error.code ? ` (${error.code})` : ""}`
        : error instanceof Error
          ? error.message
          : String(error);
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
        <p className="text-red-700">Failed to load data: {message}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-4 rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Retry
        </button>
      </div>
    );
  }

  const records = data?.records ?? [];
  const totalEnergy = data?.totalEnergy ?? 0;
  const recordCount = data?.recordCount ?? 0;
  const totalCount = pagination.totalCount;

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
      <div className="shrink-0 space-y-4">
        <FilterControls
          value={params}
          onChange={(newValue) => setParams({ ...newValue, page: 0 })}
          disabled={isLoading}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          deviceCount={deviceNames.length}
          selectedDeviceCount={useSelectedView ? visibleDevices.length : 0}
          onOpenDeviceSelector={useSelectedView ? () => setDeviceModalOpen(true) : undefined}
        />

      {deviceNames.length > DEVICE_SELECTOR_THRESHOLD && useSelectedView && (
        <ManyDevicesSuggestion deviceCount={deviceNames.length} />
      )}

      {useSelectedView && (
        <Modal
          open={deviceModalOpen}
          onClose={() => setDeviceModalOpen(false)}
          title="Devices to show in table"
          description="Select which devices appear as columns. Table shows only selected devices to avoid horizontal scrolling."
        >
          <DeviceSelector
            allDevices={deviceNames}
            selected={selectedDevices}
            onChange={setSelectedDevices}
            disabled={isLoading}
            maxHeight="20rem"
            embedded
          />
        </Modal>
      )}

      {totalCount > LARGE_RESULT_SET_THRESHOLD && (
        <WarningBanner
          message={`Large result set (${totalCount.toLocaleString()} records). Consider narrowing the date range or filters to improve performance.`}
        />
      )}

        <TotalEnergyDisplay
          recordCount={recordCount}
          totalEnergy={totalEnergy}
          isFetching={isFetching}
        />
      </div>

      {records.length === 0 ? (
        <p className="shrink-0 rounded-lg border border-gray-200 bg-white p-6 text-center text-gray-500">
          No records. Upload a CSV to get started.
        </p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden">
          <DataTable
            data={records}
            devices={visibleDevices}
            onDelete={(id) => deleteRecordMutation.mutate(id)}
            isDeleting={deleteRecordMutation.isPending}
          />
          <PaginationControls
            className="shrink-0"
            pageIndex={pagination.pageIndex}
            pageCount={pagination.pageCount}
            totalCount={pagination.totalCount}
            pageSize={pagination.pageSize}
            onPageChange={(pageIndex) =>
              setParams((prev) => ({ ...prev, page: pageIndex }))
            }
            onPageSizeChange={(pageSize) =>
              setParams((prev) => ({ ...prev, pageSize, page: 0 }))
            }
            disabled={isLoading}
          />
        </div>
      )}
    </div>
  );
}
