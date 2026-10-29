/** Spreadsheet applications evaluate formula prefixes even inside quoted CSV cells. */
export function csvCell(value: unknown): string {
  const text = String(value ?? "");
  // The control-character ranges are intentional: they catch hidden characters that could precede
  // a formula prefix, so the no-control-regex rule does not apply here.
  /* eslint-disable no-control-regex */
  const hazardous =
    /^[\s\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]*[=+\-@]/u.test(
      text,
    ) || /^[\u0000-\u001f\u007f-\u009f\u200b-\u200f\u202a-\u202e\u2060-\u206f\ufeff]/u.test(text);
  /* eslint-enable no-control-regex */
  return `"${(hazardous ? "'" + text : text).replaceAll('"', '""')}"`;
}
