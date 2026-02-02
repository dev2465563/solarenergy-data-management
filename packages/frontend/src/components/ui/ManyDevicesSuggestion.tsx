import { useState, useEffect } from "react";
import { DEVICE_SELECTOR_THRESHOLD } from "../../lib/constants.js";
import { cn } from "../../lib/utils.js";

const STORAGE_KEY = "manyDevicesSuggestionDismissed";

interface ManyDevicesSuggestionProps {
  deviceCount: number;
  onDismiss?: () => void;
  className?: string;
}

export function ManyDevicesSuggestion({
  deviceCount,
  onDismiss,
  className,
}: ManyDevicesSuggestionProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (deviceCount <= DEVICE_SELECTOR_THRESHOLD) return;
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === "true") return;
      setVisible(true);
    } catch {
      setVisible(true);
    }
  }, [deviceCount]);

  const handleDismiss = () => {
    try {
      sessionStorage.setItem(STORAGE_KEY, "true");
    } catch {}
    setVisible(false);
    onDismiss?.();
  };

  if (!visible) return null;

  return (
    <div
      role="status"
      className={cn(
        "rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 shadow-sm",
        className
      )}
    >
      <p className="font-medium">
        Many devices ({deviceCount}) — showing selected devices for readability.
      </p>
      <p className="mt-0.5 text-blue-700">
        Change anytime using the <strong>View</strong> dropdown in the filter bar.
      </p>
      <button
        type="button"
        onClick={handleDismiss}
        className="mt-2 rounded border border-blue-300 bg-white px-2 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
      >
        Got it
      </button>
    </div>
  );
}
