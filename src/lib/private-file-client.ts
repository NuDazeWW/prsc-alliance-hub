import { supabase } from "@/integrations/supabase/client";

export async function fetchPrivateFile(url: string): Promise<Blob> {
  const { data } = await supabase.auth.getSession();
  if (!data.session) throw new Error("Sign in to open this file");
  const response = await fetch(url, {
    headers: { Authorization: `Bearer ${data.session.access_token}` },
    cache: "no-store",
  });
  if (!response.ok) throw new Error("File access unavailable");
  return response.blob();
}
