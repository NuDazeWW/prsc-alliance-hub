# In-portal document reading and signing

## Recommended flow

```text
Profile submitted -> Admin notified (exists)
  -> Admin assigns documents (pick from a reusable library, per member or all, by role/company)
  -> Admin clicks "Release documents" -> member gets "Documents ready" email (one email per release, not per file)
  -> Member signs in -> Your Documents -> opens each document in the portal
       Read & acknowledge: scroll to the end, type initials, confirm
       Read & sign: scroll to the end, type full legal name, draw or type signature, agree to e-sign consent
  -> Each completion: admin dashboard updates live + admin email when ALL documents are done
  -> Member gets a "Package complete" confirmation; timeline reaches the final step
```

## What changes

**Admin side**
- **Document library**: upload a PDF once (e.g. Board Agreement, Confidentiality, Code of Conduct), set its type (Acknowledge or Sign) and who it applies to by default (PRSC / DIS / Both, Board / Advisor).
- **Auto-assign**: when a profile is submitted, the matching library documents are prepared for that member automatically as drafts. Admin can add/remove before release.
- **Release button**: documents stay hidden until the admin releases them; releasing sends the email.
- **Tracking per member**: Not opened / Opened / Acknowledged / Signed, with date, time, and initials or signature shown; download of the signed copy.
- **Reminder**: if documents are still incomplete after 3 days, one automatic reminder email.

**Member side**
- Document list split into "Read and acknowledge" and "Read and sign", with progress (e.g. 2 of 5 complete).
- Full in-portal reader (no download needed); action buttons unlock after reaching the last page.
- Signing panel: typed legal name, signature pad (draw or type in a script style), date auto-filled, consent checkbox for electronic signature.
- Completed documents show "Signed on [date]" and a downloadable signed copy.

**Emails** (branded, same style as existing ones)
1. Documents ready (to member) — on release.
2. Reminder (to member) — 3 days after release if incomplete.
3. Document completed (to admin) — single summary when the member finishes everything.
4. Package complete (to member) — thank-you confirmation.

## Why in-portal signing instead of DocuSign
Free, no extra account, and the member never leaves the private portal. We record a legally useful audit trail (name, signature, time, IP, browser, document version fingerprint) and produce a signed PDF with a signature certificate page. DocuSign links remain available as an option per document for anything requiring a third-party signing service.

## Technical details
- New tables: `portal_document_library` (template docs) and extend `portal_documents` with `library_id`, `released_at`, `status`; new `portal_document_signatures` (member_id, document_id, signed_name, signature image path, initials, ip, user_agent, file_sha256, signed_at). RLS: member reads/inserts own rows only; admin full access.
- Reader: PDF rendered client-only with `react-pdf` (lazy-loaded) from signed storage URLs; scroll-to-end gate.
- Signed copy generated server-side with `pdf-lib` (stamps signature + certificate page), stored in the private `member-documents` bucket.
- Server functions for release, sign, acknowledge; emails via the existing shared sender with idempotency keys; reminder added to the existing daily reminder job.
- Timeline and package status advance automatically: released -> In Preparation done, all complete -> Package Complete.

## Question for you
Should completed documents also be emailed to the member as a link to their signed copy, or only available inside the portal?
