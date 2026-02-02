/** timestamp required; other cols = device columns (flexible names). */
export function validateCsvHeaders(
  headers: string[]
): { ok: true; deviceNames: string[] } | { ok: false; message: string } {
  const trimmed = headers.map((h) => h.trim());
  const timestampIndex = trimmed.indexOf("timestamp");
  if (timestampIndex === -1) {
    return {
      ok: false,
      message: 'Missing "timestamp" column. Header must include exactly one column named "timestamp".',
    };
  }
  const deviceNames = trimmed.filter((_, i) => i !== timestampIndex);
  if (deviceNames.length === 0) {
    return {
      ok: false,
      message: "At least one device column required (besides timestamp).",
    };
  }
  return { ok: true, deviceNames };
}
