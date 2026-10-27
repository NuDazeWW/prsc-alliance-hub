/** Spreadsheet applications evaluate formula prefixes even inside quoted CSV cells. */
export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  const hazardous = /^[\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]*[=+\-@]/u.test(text)
    || /^[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(text);
  return `"${(hazardous ? "'" + text : text).replaceAll('"', '""')}"`;
}