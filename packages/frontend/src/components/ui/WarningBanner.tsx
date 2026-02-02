import { cn } from "../../lib/utils.js";

interface WarningBannerProps {
  message: string;
  className?: string;
}

export function WarningBanner({ message, className }: WarningBannerProps) {
  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800",
        className
      )}
    >
      {message}
    </div>
  );
}
