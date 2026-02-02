/** Format: M/D/YYYY H:MM (US). */
export function parseCsvTimestamp(value: string): Date {
  const trimmed = value.trim();
  const spaceIdx = trimmed.indexOf(" ");
  const datePart = spaceIdx >= 0 ? trimmed.slice(0, spaceIdx) : trimmed;
  const timePart = spaceIdx >= 0 ? trimmed.slice(spaceIdx + 1) : "0:00";
  const [month, day, year] = datePart.split("/").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);
  const d = new Date(year, month - 1, day, hour ?? 0, minute ?? 0);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return d;
}
