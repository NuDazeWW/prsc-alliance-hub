import { createFileRoute } from "@tanstack/react-router";
import { buildMeetingIcs, meetingIcsToken } from "@/lib/ics";

export const Route = createFileRoute("/api/public/meeting-ics")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const pollId = url.searchParams.get("poll") ?? "";
        const token = url.searchParams.get("token") ?? "";
        if (!pollId || !token) return new Response("Not found", { status: 404 });
        const expected = await meetingIcsToken(pollId);
        if (token !== expected) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: poll } = await supabaseAdmin.from("meeting_polls").select("*").eq("id", pollId).maybeSingle();
        if (!poll || poll.status !== "confirmed" || !poll.confirmed_slot_id) {
          return new Response("Not found", { status: 404 });
        }
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
            "Content-Disposition": `attachment; filename="meeting.ics"`,
          },
        });
      },
    },
  },
});
