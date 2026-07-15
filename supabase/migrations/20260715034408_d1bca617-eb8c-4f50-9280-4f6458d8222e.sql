
DROP POLICY IF EXISTS "anyone can submit briefing" ON public.briefing_requests;
CREATE POLICY "anyone can submit briefing" ON public.briefing_requests
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(first_name) BETWEEN 1 AND 80
    AND length(last_name) BETWEEN 1 AND 80
    AND length(organization) BETWEEN 1 AND 160
    AND length(role) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 200 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND interaction IN ('property','demand','channel','ecosystem')
    AND (message IS NULL OR length(message) <= 2000)
  );

DROP POLICY IF EXISTS "anyone can submit board interest" ON public.board_interest;
CREATE POLICY "anyone can submit board interest" ON public.board_interest
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(title) BETWEEN 1 AND 160
    AND length(organization) BETWEEN 1 AND 160
    AND length(email) BETWEEN 3 AND 200 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(statement) BETWEEN 20 AND 3000
    AND (linkedin_url IS NULL OR length(linkedin_url) <= 300)
  );

DROP POLICY IF EXISTS "anyone can submit vanguard interest" ON public.vanguard_interest;
CREATE POLICY "anyone can submit vanguard interest" ON public.vanguard_interest
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 120
    AND length(property) BETWEEN 1 AND 160
    AND length(role) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 200 AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND (phone IS NULL OR length(phone) <= 40)
  );
