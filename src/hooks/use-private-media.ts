import { useEffect, useState } from "react";
import { fetchPrivateFile } from "@/lib/private-file-client";

export function usePrivateMedia(url: string | null | undefined) {
  const [resolved, setResolved] = useState<string | null>(null);
  const privateUrl = url?.startsWith("/api/public/portal-file?") === true;
  useEffect(() => {
    let disposed = false;
    let objectUrl: string | null = null;
    setResolved(null);
    if (privateUrl && url)
      void fetchPrivateFile(url)
        .then((blob) => {
          if (disposed) return;
          objectUrl = URL.createObjectURL(blob);
          setResolved(objectUrl);
        })
        .catch(() => {
          if (!disposed) setResolved(null);
        });
    return () => {
      disposed = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [url, privateUrl]);
  return privateUrl ? resolved : url;
}
