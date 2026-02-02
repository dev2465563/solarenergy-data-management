export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(date));
}

export function formatEnergy(
  value: number | null | undefined
): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", { maximumFractionDigits: 1 });
}
