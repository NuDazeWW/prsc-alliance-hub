import { createFileRoute } from "@tanstack/react-router";
import { buildMeetingIcs } from "@/lib/ics";
import { z } from "zod";
import { portalAccessAllowed } from "@/lib/portal-access";

export const Route = createFileRoute("/api/public/meeting-ics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const pollId = url.searchParams.get("poll") ?? "";
        if (!z.string().uuid().safeParse(pollId).success) return new Response("Not found", { status: 404 });
        const token = request.headers.get("authorization")?.match(/^Bearer (.+)$/)?.[1];
        if (!token) return new Response("Unauthorized", { status: 401 });
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: auth, error } = await supabaseAdmin.auth.getUser(token);
        if (error || !auth.user) return new Response("Unauthorized", { status: 401 });
        const [{ data: member }, { data: role }] = await Promise.all([
          supabaseAdmin.from("portal_members").select("id, status").eq("user_id", auth.user.id).maybeSingle(),
          supabaseAdmin.from("user_roles").select("role").eq("user_id", auth.user.id).eq("role", "admin").maybeSingle(),
        ]);
        if (!portalAccessAllowed(member, Boolean(role))) return new Response("Forbidden", { status: 403 });
        const { data: poll } = await supabaseAdmin.from("meeting_polls").select("*").eq("id", pollId).maybeSingle();
        if (!poll || poll.status !== "confirmed" || !poll.confirmed_slot_id) {
          return new Response("Not found", { status: 404 });
        }
        if (!role && (!member || !poll.invited_member_ids.includes(member.id))) return new Response("Forbidden", { status: 403 });
        const { data: slot } = await supabaseAdmin
          .from("meeting_poll_slots")
          .select("starts_at")
          .eq("id", poll.confirmed_slot_id)
          .single();
        if (!slot) return new Response("Not found", { status: 404 });

        const location =
          poll.format === "virtual" ? poll.virtual_link || "Virtual (link to follow)" : poll.location || undefined;
        const ics = buildMeetingIcs({
          uid: `${poll.id}@prscstandards.org`,
          title: poll.title,
          description: poll.description,
          location,
          startsAt: slot.starts_at,
          durationMinutes: poll.duration_minutes,
        });
        return new Response(ics, {
          headers: {
            "Content-Type": "text/calendar; charset=utf-8",
            "Cache-Control": "private, no-store",
            "Content-Disposition": `attachment; filename="meeting.ics"`,
          },
        });
      },
    },
  },
});
