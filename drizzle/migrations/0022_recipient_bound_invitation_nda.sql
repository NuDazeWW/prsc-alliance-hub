CREATE TABLE public.invitation_nda_evidence (
 reference text PRIMARY KEY,
 recipient_email text NOT NULL,
 recipient_name text NOT NULL,
 entities text NOT NULL CHECK (entities IN ('prsc','dis','both')),
 scope text NOT NULL,
 reviewer_id uuid NOT NULL,
 verified_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.invitation_nda_evidence TO authenticated;
GRANT ALL ON public.invitation_nda_evidence TO service_role;
ALTER TABLE public.invitation_nda_evidence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins read invitation NDA evidence" ON public.invitation_nda_evidence FOR SELECT TO authenticated USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE OR REPLACE FUNCTION public.bind_invitation_nda(p_reference text,p_email text,p_name text,p_entities text,p_scope text,p_reviewer uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE evidence public.invitation_nda_evidence;
BEGIN
 INSERT INTO public.invitation_nda_evidence(reference,recipient_email,recipient_name,entities,scope,reviewer_id) VALUES(lower(trim(p_reference)),lower(trim(p_email)),p_name,p_entities,p_scope,p_reviewer) ON CONFLICT DO NOTHING;
 SELECT * INTO evidence FROM public.invitation_nda_evidence WHERE reference=lower(trim(p_reference)) FOR UPDATE;
 IF evidence.recipient_email<>lower(trim(p_email)) OR evidence.recipient_name<>p_name OR evidence.entities<>p_entities OR evidence.scope<>p_scope THEN RAISE EXCEPTION 'NDA reference already bound to a different recipient or scope; verify recipient-specific evidence'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.bind_invitation_nda(text,text,text,text,text,uuid) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.bind_invitation_nda(text,text,text,text,text,uuid) TO service_role;