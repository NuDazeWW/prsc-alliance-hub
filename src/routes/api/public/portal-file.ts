import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { portalAccessAllowed } from "@/lib/portal-access";
import { leadershipPublicationAllowed, linkedProfilePermissions } from "@/lib/leadership-publication";

export const Route = createFileRoute("/api/public/portal-file")({
  server: { handlers: { GET: async ({ request }) => {
    const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
    if (!token) return new Response("Unauthorized", { status: 401 });
    const params = Object.fromEntries(new URL(request.url).searchParams);
    const input = z.object({ kind: z.enum(["document", "headshot", "leader"]), id: z.string().uuid() }).safeParse(params);
    if (!input.success) return new Response("Not found", { status: 404 });
    const { supabaseAdmin: sb } = await import("@/integrations/supabase/client.server");
    const { data: auth, error } = await sb.auth.getUser(token);
    if (error || !auth.user) return new Response("Unauthorized", { status: 401 });
    const [{ data: member }, { data: role }] = await Promise.all([
      sb.from("portal_members").select("*").eq("user_id", auth.user.id).maybeSingle(),
      sb.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle(),
    ]);
    const admin = Boolean(role);
    if (!portalAccessAllowed(member, admin)) return new Response("Forbidden", { status: 403 });
    let bucket = "member-documents";
    let path: string | null = null;
    if (input.data.kind === "document") {
      const { data: doc } = await sb.from("portal_documents").select("*").eq("id", input.data.id).maybeSingle();
      if (!doc) return new Response("Not found", { status: 404 });
      if (!admin) {
        // Use the caller's existing RLS projection, not a privileged substitute.
        const { createClient } = await import("@supabase/supabase-js");
        const key = process.env["SUPABASE_PUBLISHABLE_KEY"];
        const url = process.env["SUPABASE_URL"];
        if (!key || !url) return new Response("Unavailable", { status: 503 });
        const client = createClient(url, key, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false, autoRefreshToken: false } });
        const { data: allowed } = await client.from("portal_documents").select("id").eq("id", doc.id).maybeSingle();
        if (!allowed) return new Response("Forbidden", { status: 403 });
      }
      path = doc.file_path;
    } else if (input.data.kind === "headshot") {
      if (!admin && member?.id !== input.data.id) return new Response("Forbidden", { status: 403 });
      const { data: profile } = await sb.from("portal_profiles").select("headshot_path").eq("member_id", input.data.id).maybeSingle();
      bucket = "member-headshots";
      path = profile?.headshot_path ?? null;
    } else {
      const { data: row } = await sb.from("leadership_team").select("*").eq("id", input.data.id).maybeSingle();
      if (!row || (!admin && (!row.visible || !leadershipPublicationAllowed(row)))) return new Response("Forbidden", { status: 403 });
      const { data: profile } = row.member_id ? await sb.from("portal_profiles").select("headshot_path, visibility_instructions").eq("member_id", row.member_id).maybeSingle() : { data: null };
      if (!admin && row.member_id && !linkedProfilePermissions(profile?.visibility_instructions as Record<string, unknown>).photo) return new Response("Forbidden", { status: 403 });
      bucket = row.photo_path ? "leadership-photos" : "member-headshots";
      path = row.photo_path ?? profile?.headshot_path ?? null;
    }
    if (!path) return new Response("Not found", { status: 404 });
    const { data: file, error: fileError } = await sb.storage.from(bucket).download(path);
    if (fileError || !file) return new Response("Not found", { status: 404 });
    return new Response(file, { headers: { "Content-Type": file.type || "application/octet-stream", "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" } });
  } } },
});