interface TotalEnergyDisplayProps {
  recordCount: number;
  totalEnergy: number;
  isFetching?: boolean;
}

export function TotalEnergyDisplay({
  recordCount,
  totalEnergy,
  isFetching = false,
}: TotalEnergyDisplayProps) {
  return (
    <div className="flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-3">
      <span className="text-sm text-gray-600">
        Records: <strong>{recordCount.toLocaleString()}</strong>
      </span>
      <span className="text-sm text-gray-600">
        Total energy: <strong>{totalEnergy.toLocaleString()}</strong>
      </span>
      {isFetching && (
        <span className="text-sm text-gray-500" aria-live="polite">
          Refreshing…
        </span>
      )}
    </div>
  );
}
