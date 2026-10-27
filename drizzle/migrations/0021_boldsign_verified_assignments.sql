CREATE TABLE public.boldsign_assignments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 member_id uuid NOT NULL REFERENCES public.portal_members(id),
 document_id uuid NOT NULL REFERENCES public.portal_documents(id),
 boldsign_document_id text NOT NULL,
 signer_email text NOT NULL,
 version_label text NOT NULL,
 entity text NOT NULL,
 status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','signed','completed')),
 signer_completed_at timestamptz,
 completed_at timestamptz,
 executed_path text,
 audit_path text,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(member_id, document_id),
 UNIQUE(boldsign_document_id, signer_email)
);
GRANT SELECT ON public.boldsign_assignments TO authenticated;
GRANT ALL ON public.boldsign_assignments TO service_role;
ALTER TABLE public.boldsign_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read signing assignments" ON public.boldsign_assignments FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Current members read own signing assignments" ON public.boldsign_assignments FOR SELECT TO authenticated USING (public.portal_access_current() AND EXISTS (SELECT 1 FROM public.portal_members m WHERE m.id=member_id AND m.user_id=auth.uid()));
CREATE OR REPLACE FUNCTION public.complete_boldsign_assignment(p_id uuid, p_executed_path text, p_audit_path text)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE a public.boldsign_assignments;
BEGIN
 SELECT * INTO a FROM public.boldsign_assignments WHERE id=p_id FOR UPDATE;
 IF NOT FOUND OR a.status='completed' THEN RETURN false; END IF;
 IF p_executed_path IS NULL OR p_audit_path IS NULL THEN RAISE EXCEPTION 'Completion evidence required'; END IF;
 UPDATE public.boldsign_assignments SET status='completed',completed_at=now(),executed_path=p_executed_path,audit_path=p_audit_path WHERE id=a.id;
 INSERT INTO public.portal_document_acknowledgements(document_id,member_id,initials,kind,consent) VALUES(a.document_id,a.member_id,'BOLDSIGN','external_confirmed',true) ON CONFLICT DO NOTHING;
 INSERT INTO public.portal_activity(member_id,actor_user_id,event_type,metadata) VALUES(a.member_id,NULL,'boldsign_auto_confirmed',jsonb_build_object('document_id',a.document_id,'boldsign_document_id',a.boldsign_document_id,'version',a.version_label,'entity',a.entity));
 RETURN true;
END $$;
REVOKE ALL ON FUNCTION public.complete_boldsign_assignment(uuid,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.complete_boldsign_assignment(uuid,text,text) TO service_role;