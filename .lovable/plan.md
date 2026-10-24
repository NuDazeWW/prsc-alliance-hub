# Governance Corrections + Strategic Forum Center

This adds to the existing portal. Nothing gets redesigned, and no existing member, signature, or audit record is reset or activated. The work ships in two releases, and Priority A ships first.

## Audit findings (current state)

- **DIS name:** the app's screens and emails already say "Decision Intelligence Systems". The wrong names ("Decentralized Identity Standards", "Data Intelligence Systems") appear only in the downloadable journey guide. We will add "Inc." / "LLC" to the full legal names.
- **"Board Member" wording:** it appears before appointment in the invitation email, sign-in page, Questions page, Leadership Team panel and Admin Center.
- **NDA:** the portal has no NDA check today. NDA status is assumed outside the portal.
- **Conflict / Recusal:** this is a normal sign item. Signing it clears Stage 1 automatically, even when a conflict is disclosed.
- **Mixed roles:** "Both" and the PRSC/DIS mixed roles can be provisioned with no review.
- **Document access:** limited only by member, entity, role and stage. Documents have no confidentiality classification.

## Priority A — safe to send invitations

1. **Legal names:** use "Decision Intelligence Systems, Inc." and "Partnership Readiness Standards Council, LLC" in emails, legal acknowledgments and the Orientation Hub. Correct the guide as a v2 file.
2. **Status labels** (one shared helper, used in the portal, admin and emails):
   - Invited Candidate: invited, not yet signed in
   - Forum Participant: Forum cleared, not appointed
   - Pending Appointment: Stage 3 done, Stage 4 still open
   - Appointed: activation recorded for that entity, PRSC and DIS tracked separately

   Invitations say "PRSC Board Candidate" (and the like) instead of "Board Member". The Leadership Team panel shows only appointed members, or marks the others "Candidate".
3. **NDA gate:** admin records "NDA verified" (date and who verified) on each member. An invitation cannot be sent until it is recorded. The invite form adds a checkbox for this.
4. **Dual-role review:** choosing "Both" or a mixed PRSC/DIS role flags the member "Governance review required". Invitations, documents and activation stay blocked until an admin records a review decision (approved or declined, reviewer, note). Every past decision is kept.
5. **Conflict review:** the Conflict / Recusal form asks for: No conflict / New or changed conflict / Unsure, please review, plus details. Any answer except "No conflict" sets the status to "Clearance pending review". The admin can then clear, clear with restrictions (a note listing which sessions or materials are limited), or escalate. Every step is logged. Stage 1 is cleared only when the answer is "No conflict" or the admin has cleared it.
6. **Meeting-specific confirmations:** each new Forum session can request a fresh conflict confirmation and an agenda acknowledgment, tied to that meeting. People who are Forum-cleared but not yet appointed can open permitted Forum materials without finishing their role appointment.
7. **Outdated materials:** documents can be marked "Superseded". Superseded documents disappear from member views but stay in the audit history.

## Priority B — Strategic Forum Center

- **New "Strategic Forum Center" page in the member portal.** Only Forum-cleared participants can open it, and the server enforces this. Initial Forum: "DIS–PRSC Motorsport Strategic Coordination Forum". It has five sections:
  - **A. Overview:** non-voting notice, the meeting and its calendar, the agenda version
  - **B. Executive Briefing:** versioned documents with acknowledgment, plus sanitized summaries
  - **C. Executive Questions:** up to 3 prioritized questions per round, with category, why it matters, suggested source and confidentiality. Nothing goes outside automatically.
  - **D. Forum Clearance:** your status and any restrictions
  - **E. Follow-Up:** the approved Coordination Note, your assigned tasks and open questions
- **Admin Question Register:** review, merge duplicates, group, set owner and priority, choose the source and route ([C]/[P]/[D]/[X]), track the six statuses, and export an approved list. Sharing anything outside the portal takes a separate admin action that is logged.
- **Coordination Dashboard:** the 7 workstreams, each with summary, evidence state, principal open question, next action, owner, target date, route and status. It has no voting, approval or certification features. Restricted [X] items appear only to authorized users.
- **Material classification:** each document gets one of five levels (General Orientation, Confidential Forum, Restricted Opportunity, Entity-Specific Confidential, Secretariat Only). The server enforces access, including per-person permission for Restricted Opportunity. Jared Odrick / NASCAR source files can only go in at Restricted.
- **Emails:** eight new admin-editable notification templates. The admin picks recipients and approves every send, and nothing goes to the whole membership. Emails link into the portal and carry no attachments.
- **Records wording:** these are "Coordination Records", never minutes. Conflict disclosures and agreements stay separate from general Forum records.

## Testing

- Automated checks cover the new rules: the NDA gate, the dual-role block, conflict review holding Stage 1, classification access, the 3-question limit, and Forum-cleared access without appointment.
- Then a signed-in walkthrough of the 14 scenarios, reported as pass or fail.
- Before release, confirm that existing signatures, timestamps and roles are unchanged.

## Technical details

- **New database fields (all additive with safe defaults, so existing members keep working):**
  - members: NDA verification and dual-role review status
  - acknowledgements: conflict answer and admin review status/notes
  - documents: classification, superseded marker and optional meeting link
- **New tables:** governance reviews, forum question rounds and questions, workstreams, and restricted-material grants. All have security rules that allow admins full access and members access only to their own rows.
- **Rules location:** the journey rules file holds the new clearance logic, so the portal, admin and server stay in agreement. Labels come from the shared role helper.
- **Rollback:** columns default to today's behavior, and new tables can be ignored by switching the code back.

## Open decisions (defaults are used unless you say otherwise)

- **Prohibited combinations:** by default, every cross-entity mixed role ("Both", PRSC Board/DIS Advisor, PRSC Advisor/DIS Board) needs a recorded review. Tell me which combinations are outright prohibited.
- **Leadership panel:** by default it shows appointed members only.
- **Legal documents:** their text is not rewritten. Only names and labels in the portal's own wording change.
