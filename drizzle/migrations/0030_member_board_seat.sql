-- The actual board seat, recorded by an administrator once it is determined. Informational: it never grants access or activates an appointment.
ALTER TABLE public.portal_members ADD COLUMN IF NOT EXISTS board_seat text;
ALTER TABLE public.portal_members DROP CONSTRAINT IF EXISTS portal_members_board_seat_length;
ALTER TABLE public.portal_members ADD CONSTRAINT portal_members_board_seat_length CHECK (board_seat IS NULL OR char_length(board_seat) <= 160);
COMMENT ON COLUMN public.portal_members.board_seat IS 'Board seat assigned once determined (free text, admin-set). Informational only.';
