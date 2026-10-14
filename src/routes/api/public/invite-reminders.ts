import { createFileRoute } from "@tanstack/react-router";

const REMINDER_AFTER_DAYS = 3;

export const Route = createFileRoute("/api/public/invite-reminders")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["SUPABASE_PUBLISHABLE_KEY"] ?? process.env["VITE_SUPABASE_PUBLISHABLE_KEY"];
        if (!expected || request.headers.get("apikey") !== expected) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { sendPortalEmail, founderSignature } = await import("@/lib/portal-notify.server");
        const cutoff = new Date(Date.now() - REMINDER_AFTER_DAYS * 86400000).toISOString();
        const { data: pending, error } = await supabaseAdmin
          .from("portal_members")
          .select("id, email, first_name, entity, role")
          .eq("status", "invited")
          .is("first_access_at", null)
          .is("reminder_sent_at", null)
          .lt("invited_at", cutoff)
          .limit(50);
        if (error) return new Response(error.message, { status: 500 });
        let sent = 0;
        for (const m of pending ?? []) {
          const redirectTo = new URL("https://access.prscstandards.org/accept-invitation");
          redirectTo.searchParams.set("first_name", m.first_name ?? "");
          redirectTo.searchParams.set("entity", m.entity);
          redirectTo.searchParams.set("role", m.role);
          const { data: link, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
            type: "magiclink",
            email: m.email,
            options: { redirectTo: redirectTo.toString() },
          });
          if (linkError || !link?.properties?.action_link) {
            console.error("Reminder link failed", m.email, linkError);
            continue;
          }
          const firstName = m.first_name?.trim() || "there";
          const entityShort = m.entity === "both" ? "PRSC and DIS" : String(m.entity).toUpperCase();
          await sendPortalEmail(
            m.email,
            {
              subject: "A reminder: your private Welcome Center is waiting",
              eyebrow: "Gentle reminder",
              heading: `${firstName}, your Welcome Center is ready for you.`,
              body: `A few days ago we invited you into the private ${entityShort} Board & Advisor Welcome Center. We noticed you haven't had a chance to enter yet.\n\nIt only takes a few minutes: create your password, get reacquainted with where we are today, and share the few details we need to prepare your individualized package.`,
              ctaLabel: "Access Your Private Welcome Center →",
              ctaUrl: link.properties.action_link,
              ctaSubtext: "This secure link lets you create your own password. No password is emailed.",
              signatures: founderSignature(),
            },
            "invite-reminder",
          );
          await supabaseAdmin.from("portal_members").update({ reminder_sent_at: new Date().toISOString() }).eq("id", m.id);
          sent++;
        }
        const { data: docPending } = await supabaseAdmin
          .from("portal_members")
          .select("id, email, first_name")
          .not("documents_released_at", "is", null)
          .is("documents_completed_at", null)
          .is("documents_reminder_sent_at", null)
          .lt("documents_released_at", cutoff)
          .limit(50);
        for (const m of docPending ?? []) {
          await sendPortalEmail(
            m.email,
            {
              subject: "A reminder: your documents are waiting",
              eyebrow: "Gentle reminder",
              heading: `${m.first_name?.trim() || "There"}, your documents are still waiting.`,
              body: "A few days ago we released your individualized documents in your private Welcome Center. A few are still open.\n\nSign in, open Your Documents, and read, initial, or sign each one right in the portal.",
              ctaLabel: "Review & Sign Your Documents",
              ctaUrl: "https://access.prscstandards.org/portal",
              signatures: founderSignature(),
            },
            "documents-reminder",
          );
          await supabaseAdmin.from("portal_members").update({ documents_reminder_sent_at: new Date().toISOString() }).eq("id", m.id);
          sent++;
        }
        const nudgeCutoff = new Date(Date.now() - 48 * 3600000).toISOString();
        const { data: openPolls } = await supabaseAdmin
          .from("meeting_polls")
          .select("id, title, meeting_type, invited_member_ids")
          .eq("status", "open")
          .is("auto_nudge_sent_at", null)
          .lt("created_at", nudgeCutoff)
          .limit(20);
        for (const poll of openPolls ?? []) {
          const { data: responses } = await supabaseAdmin
            .from("meeting_poll_responses")
            .select("member_id")
            .eq("poll_id", poll.id);
          const answered = new Set((responses ?? []).map((r: { member_id: string }) => r.member_id));
          const pendingIds = (poll.invited_member_ids as string[]).filter((id) => !answered.has(id));
          if (!pendingIds.length) {
            await supabaseAdmin.from("meeting_polls").update({ auto_nudge_sent_at: new Date().toISOString() }).eq("id", poll.id);
            continue;
          }
          const { data: pendingMembers } = await supabaseAdmin
            .from("portal_members")
            .select("id, email, first_name")
            .in("id", pendingIds);
          for (const m of pendingMembers ?? []) {
            await sendPortalEmail(
              m.email,
              {
                subject: `Quick reminder: your availability for ${poll.title}`,
                eyebrow: "Gentle reminder",
                heading: `${m.first_name?.trim() || "Hello"}, we are still collecting availability.`,
                body: `We are finding a time for "${poll.title}" and your answer is one of the few still outstanding.\n\nIt takes under a minute — open your private Welcome Center, go to Meetings, and mark each proposed time Available, If needed, or Unavailable.`,
                ctaLabel: "Share Your Availability",
                ctaUrl: "https://access.prscstandards.org/portal",
                signatures: founderSignature(),
              },
              "meeting-poll-nudge",
            );
            sent++;
          }
          await supabaseAdmin.from("meeting_polls").update({ auto_nudge_sent_at: new Date().toISOString() }).eq("id", poll.id);
        }
        return Response.json({ ok: true, sent });
      },
    },
  },
});
