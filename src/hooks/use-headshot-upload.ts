import { userFacingError } from "@/lib/user-facing-error";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { setMyHeadshot } from "@/lib/portal.functions";

export function useHeadshotUpload() {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  async function upload(file: File) {
    if (!file.type.startsWith("image/")) {
      setMsg("Please choose an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setMsg("Please choose an image under 5 MB.");
      return;
    }
    setBusy(true);
    setMsg("Uploading…");
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Session expired. Please sign in again.");
      const ext =
        (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
      const path = `${user.id}/headshot-${Date.now()}.${ext}`;
      const { error } = await supabase.storage
        .from("member-headshots")
        .upload(path, file, { cacheControl: "3600", upsert: false });
      if (error) throw error;
      await setMyHeadshot({ data: { path } });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["my-headshot"] }),
        queryClient.invalidateQueries({ queryKey: ["leadership-team"] }),
        queryClient.invalidateQueries({ queryKey: ["leadership"] }),
      ]);
      setMsg("Photo saved.");
    } catch (e) {
      setMsg(userFacingError(e, "Upload failed. Please try again."));
    } finally {
      setBusy(false);
    }
  }
  return { upload, busy, msg };
}
