import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requirePortalAccess } from "@/lib/portal-access";
import { invitationNdaSaveSchema } from "./invitation-nda";

const memberIdSchema = z.object({ member_id: z.string().uuid() }).strict();
async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.from("user_roles").select("role").eq("user_id", context.userId).eq("role", "admin").maybeSingle();
  if (error || !data) throw new Error("Unauthorized");
}
export const getInvitationNda = createServerFn({ method: "GET" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => memberIdSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { loadInvitationNda } = await import("./invitation-nda.server");
    return loadInvitationNda(context.supabase, data.member_id);
  });

export const saveInvitationNdaVerification = createServerFn({ method: "POST" })
  .middleware([requirePortalAccess])
  .inputValidator((input) => invitationNdaSaveSchema.parse(input))
  .handler(async ({ context, data }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { saveReviewedInvitationNda } = await import("./invitation-nda.server");
    return saveReviewedInvitationNda(supabaseAdmin, context.userId, data);
  });
