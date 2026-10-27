import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { leadershipPublicationAllowed, linkedProfilePermissions } from "./leadership-publication";
import { requirePortalAccess } from "@/lib/portal-access";

export type LeaderRow = {
  id: string;
  name: string;
  title: string;
  affiliation: string | null;
  bio: string | null;
  photo_url: string | null;
  member_id: string | null;
  sort_order: number;
  visible: boolean;
  is_placeholder: boolean;
  photo_path: string | null;
  own_bio: string | null;
  publication_scope?: string;
};
export type LeadershipSettings = { eyebrow: string; heading: string; subtext: string };

async function isAdmin(context: { supabase: any; userId: string }) {
  const { data } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  return Boolean(data);
}

/** Team list for the Welcome Center (and admin editor). Admin-entered values win; linked member profile fills blanks. */
export const getLeadershipTeam = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .handler(async ({ context }) => {
    const admin = await isAdmin(context);
    let teamQuery = context.supabase.from("leadership_team").select("*").order("sort_order").order("created_at");
    if (!admin) teamQuery = teamQuery.eq("visible", true);
    const [{ data: allRows, error }, { data: settings }] = await Promise.all([
      teamQuery,
      context.supabase.from("leadership_settings").select("eyebrow, heading, subtext").maybeSingle(),
    ]);
    if (error) throw error;
    const rows = (allRows ?? []).filter((r: any) => admin || leadershipPublicationAllowed(r));
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const memberIds = (rows ?? []).map((r: any) => r.member_id).filter(Boolean);
    const profiles = new Map<string, { bio: string | null; headshot_path: string | null; visibility_instructions: Record<string, unknown> | null }>();
    if (memberIds.length) {
      const { data } = await supabaseAdmin.from("portal_profiles").select("member_id, bio, headshot_path, visibility_instructions").in("member_id", memberIds);
      for (const p of data ?? []) profiles.set(p.member_id, { bio: p.bio, headshot_path: p.headshot_path, visibility_instructions: p.visibility_instructions as Record<string, unknown> });
    }
    const assembled = await Promise.all(
      (rows ?? []).map(async (r: any) => {
        const prof = r.member_id ? profiles.get(r.member_id) : undefined;
        const permitted = linkedProfilePermissions(prof?.visibility_instructions);
        if (!admin && r.member_id && !permitted.name) return null;
        let photo_url: string | null = null;
        if (r.photo_path && (admin || !r.member_id || permitted.photo)) {
          const { data } = await supabaseAdmin.storage.from("leadership-photos").createSignedUrl(r.photo_path, 3600);
          photo_url = data?.signedUrl ?? null;
        } else if (prof?.headshot_path && (admin || permitted.photo)) {
          const { data } = await supabaseAdmin.storage.from("member-headshots").createSignedUrl(prof.headshot_path, 3600);
          photo_url = data?.signedUrl ?? null;
        }
        return {
          id: r.id,
          name: r.name,
          title: r.title,
          affiliation: admin || !r.member_id || permitted.affiliation ? r.affiliation ?? null : null,
          bio: admin || !r.member_id || permitted.bio ? (r.bio?.trim() ? r.bio : prof?.bio ?? null) : null,
          own_bio: admin ? r.bio : null,
          publication_scope: admin ? r.publication_scope : undefined,
          photo_url,
          photo_path: admin ? r.photo_path : null,
          member_id: admin ? r.member_id : null,
          sort_order: r.sort_order,
          visible: r.visible,
          is_placeholder: r.is_placeholder,
        };
      }),
    );
    return {
      admin,
      team: assembled.filter((r): r is NonNullable<typeof r> => r !== null),
      settings: (settings as LeadershipSettings | null) ?? {
        eyebrow: "Our Leadership Team",
        heading: "Our Leadership Team",
        subtext: "A distinguished group of advisors and executives guiding PRSC's mission and industry impact.",
      },
    };
  });

const leaderSchema = z.object({
  id: z.string().uuid().optional(),
  publication_scope: z.enum(["none", "portal_members"]).default("none"),
  name: z.string().trim().min(1).max(160),
  title: z.string().trim().max(160),
  affiliation: z.string().trim().max(200).nullable().optional(),
  bio: z.string().trim().max(3000).nullable(),
  member_id: z.string().uuid().nullable(),
  visible: z.boolean(),
  sort_order: z.number().int(),
  photo_path: z.string().max(400).nullable(),
});

export const saveLeader = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => leaderSchema.parse(i))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context))) throw new Error("Unauthorized");
    const { id, ...rest } = data;
    const approved = rest.publication_scope === "portal_members";
    const row = { ...rest, publication_approved_at: approved ? new Date().toISOString() : null, publication_approved_by: approved ? context.userId : null, bio: rest.bio || null, affiliation: rest.affiliation || null, is_placeholder: false };
    const q = id
      ? context.supabase.from("leadership_team").update(row).eq("id", id)
      : context.supabase.from("leadership_team").insert(row);
    const { error } = await q;
    if (error) throw error;
    return { ok: true };
  });

export const deleteLeader = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ id: z.string().uuid() }).parse(i))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context))) throw new Error("Unauthorized");
    const { error } = await context.supabase.from("leadership_team").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const reorderLeaders = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) => z.object({ ids: z.array(z.string().uuid()).max(200) }).parse(i))
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context))) throw new Error("Unauthorized");
    await Promise.all(data.ids.map((id, i) => context.supabase.from("leadership_team").update({ sort_order: i + 1 }).eq("id", id)));
    return { ok: true };
  });

export const saveLeadershipSettings = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((i) =>
    z.object({ eyebrow: z.string().trim().max(80), heading: z.string().trim().min(1).max(160), subtext: z.string().trim().max(600) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    if (!(await isAdmin(context))) throw new Error("Unauthorized");
    const { error } = await context.supabase.from("leadership_settings").upsert({ singleton: true, ...data, updated_at: new Date().toISOString() });
    if (error) throw error;
    return { ok: true };
  });
