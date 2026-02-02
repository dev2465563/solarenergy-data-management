import { useState, useMemo } from "react";
import { cn } from "../../lib/utils.js";

const DEFAULT_SELECTED_COUNT = 10;

interface DeviceSelectorProps {
  allDevices: string[];
  selected: string[];
  onChange: (selected: string[]) => void;
  disabled?: boolean;
  className?: string;
  maxHeight?: string;
  /** Hide legend/description (e.g. in modal). */
  embedded?: boolean;
}

export function DeviceSelector({
  allDevices,
  selected,
  onChange,
  disabled = false,
  className,
  maxHeight = "12rem",
  embedded = false,
}: DeviceSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return allDevices;
    const q = search.trim().toLowerCase();
    return allDevices.filter((d) => d.toLowerCase().includes(q));
  }, [allDevices, search]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const toggle = (device: string) => {
    if (selectedSet.has(device)) {
      onChange(selected.filter((d) => d !== device));
    } else {
      onChange([...selected, device].sort());
    }
  };

  const selectFirstN = (n: number) => {
    onChange(allDevices.slice(0, n));
  };

  const selectAll = () => onChange([...allDevices]);
  const clearAll = () => onChange([]);

  return (
    <fieldset
      className={cn("rounded-lg border border-gray-200 bg-white p-4", className)}
      disabled={disabled}
    >
      {!embedded && (
        <>
          <legend className="text-sm font-medium text-gray-700 px-1">
            Devices to show in table
          </legend>
          <p className="mt-1 text-xs text-gray-500 mb-2">
            Select which devices appear as columns. Table shows only selected devices
            to avoid horizontal scrolling.
          </p>
        </>
      )}
      <div className="flex flex-wrap gap-2 mb-2">
        <input
          type="search"
          placeholder="Search devices..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="rounded border border-gray-300 px-2 py-1.5 text-sm w-48 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          aria-label="Search devices"
        />
        <button
          type="button"
          onClick={() => selectFirstN(DEFAULT_SELECTED_COUNT)}
          className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
        >
          First {DEFAULT_SELECTED_COUNT}
        </button>
        <button
          type="button"
          onClick={selectAll}
          className="text-sm text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-500 rounded px-1"
        >
          All
        </button>
        <button
          type="button"
          onClick={clearAll}
          className="text-sm text-gray-600 hover:underline focus:outline-none focus:ring-2 focus:ring-gray-400 rounded px-1"
        >
          Clear
        </button>
      </div>
      <div
        className="border border-gray-200 rounded overflow-y-auto overflow-x-hidden"
        style={{ minHeight: maxHeight, maxHeight }}
        role="group"
        aria-label="Device list"
      >
        <div className="p-2 space-y-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-500">No devices match.</p>
          ) : (
            filtered.map((device) => (
              <label
                key={device}
                className="flex items-center gap-2 py-0.5 cursor-pointer hover:bg-gray-50 rounded px-1"
              >
                <input
                  type="checkbox"
                  checked={selectedSet.has(device)}
                  onChange={() => toggle(device)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-800">{device}</span>
              </label>
            ))
          )}
        </div>
      </div>
      <p className="mt-2 text-xs text-gray-500">
        {selected.length} of {allDevices.length} selected
      </p>
    </fieldset>
  );
}
