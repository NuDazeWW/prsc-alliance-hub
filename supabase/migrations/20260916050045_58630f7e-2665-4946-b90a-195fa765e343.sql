CREATE TABLE public.portal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid REFERENCES public.portal_members(id) ON DELETE CASCADE,
  category text NOT NULL CHECK (category IN ('sign','read')),
  action text NOT NULL CHECK (action IN ('docusign','download','acknowledge')),
  title text NOT NULL CHECK (length(title) BETWEEN 1 AND 200),
  description text NOT NULL DEFAULT '',
  external_url text,
  file_path text,
  sort_order integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.portal_documents TO authenticated;
GRANT ALL ON public.portal_documents TO service_role;

ALTER TABLE public.portal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can manage documents" ON public.portal_documents
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can read their documents" ON public.portal_documents
  FOR SELECT TO authenticated
  USING (
    member_id IS NULL
    OR EXISTS (
      SELECT 1 FROM public.portal_members m
      WHERE m.id = portal_documents.member_id
        AND m.user_id = auth.uid()
        AND m.status <> 'revoked'::portal_member_status
    )
  );

CREATE TRIGGER portal_documents_updated_at
  BEFORE UPDATE ON public.portal_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_portal_updated_at();

CREATE TABLE public.portal_document_acknowledgements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.portal_documents(id) ON DELETE CASCADE,
  member_id uuid NOT NULL REFERENCES public.portal_members(id) ON DELETE CASCADE,
  initials text NOT NULL CHECK (length(initials) BETWEEN 1 AND 8),
  acknowledged_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (document_id, member_id)
);

GRANT SELECT, INSERT ON public.portal_document_acknowledgements TO authenticated;
GRANT ALL ON public.portal_document_acknowledgements TO service_role;

ALTER TABLE public.portal_document_acknowledgements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Administrators can manage acknowledgements" ON public.portal_document_acknowledgements
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Members can read their acknowledgements" ON public.portal_document_acknowledgements
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.portal_members m
    WHERE m.id = portal_document_acknowledgements.member_id
      AND m.user_id = auth.uid()
      AND m.status <> 'revoked'::portal_member_status
  ));

CREATE POLICY "Members can record their acknowledgements" ON public.portal_document_acknowledgements
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.portal_members m
    WHERE m.id = portal_document_acknowledgements.member_id
      AND m.user_id = auth.uid()
      AND m.status <> 'revoked'::portal_member_status
  ));