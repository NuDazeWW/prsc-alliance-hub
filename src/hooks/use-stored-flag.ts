import { useEffect, useState } from "react";

/** Boolean UI preference remembered in this browser (read after hydration). */
export function useStoredFlag(key: string, initial = false) {
  const [value, setValue] = useState(initial);
  useEffect(() => {
    const saved = window.localStorage.getItem(key);
    if (saved !== null) setValue(saved === "1");
  }, [key]);
  const update = (next: boolean) => {
    setValue(next);
    window.localStorage.setItem(key, next ? "1" : "0");
  };
  return [value, update] as const;
}
