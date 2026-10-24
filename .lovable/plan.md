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
   - Appointed: shown only after an admin has verified, for that entity, each required item: the entity-specific agreements, the countersignature, the appointment action, and the activation record. PRSC and DIS are tracked separately. Changing a status by hand cannot confer appointment or authority.

   Invitations say "PRSC Board Candidate" (and the like) instead of "Board Member". The Leadership Team panel shows only appointed members, or marks the others "Candidate".
3. **NDA verification:** on each member, the admin records the verification date, the verifying administrator, and the NDA's document reference or controlled storage location. The admin also records which entity or entities the NDA covers (PRSC, DIS, or both) and the information-sharing scope. An invitation cannot be sent until these are recorded and the coverage matches the member's entity. Existing accounts with no verification on file are locked out of confidential Forum materials (fail-closed) until an admin records it.
4. **Role-combination rules (two tiers):**
   - **Hard-prohibited:** applies only to combinations that an operative governance document prohibits. Each rule records the clause it rests on. There is no admin override. A combination is added to this list only after you confirm the source document.
   - **Blocked pending review:** every other cross-entity combination ("Both", PRSC Board/DIS Advisor, PRSC Advisor/DIS Board, Methodology Committee + any DIS role, PRSC Advisor + DIS Advisor). These stay blocked, not permanently prohibited. Invitations, documents and activation are held until an admin records a formal governance/legal review: decision, reviewer, date, a separate engagement scope for each entity, and the conflict controls applied.
   - Every decision is kept in history.
5. **Conflict clearance:** the Conflict / Recusal form asks: No conflict / New or changed conflict / Unsure, please review, plus details. A signed confirmation never resolves a conflict by itself, including "No conflict". Before Stage 1 Forum clearance, an admin completes a clearance check covering current disclosures, existing restrictions, NDA status, and eligibility for the specific meeting. The admin records their identity, decision (clear / clear with restrictions / escalate / decline), date, and any restrictions. Every step is logged.
6. **Forum preparation vs. clearance:** NDA-verified invitees can open only the materials needed to finish Stage 1: the Protocol, the approved Pre-Read, and the Conflict / Recusal Confirmation. They do not need clearance first. Restricted and other Forum content opens only after clearance, filtered by the person's permissions and restrictions. The Stage 1 list and the Strategic Forum Center use the same access rule, so the two always agree. Each new Forum session can request a fresh conflict confirmation and agenda acknowledgment tied to that meeting.
7. **Superseded and revised documents:** marking a document "Superseded" removes it from active onboarding and acknowledgment lists. Signed copies, signatures and audit history are kept, and the member can still see their own signed copy under historical records. When a materially revised version is issued, it is a new document that needs a new acknowledgment. The earlier signature stays linked to the earlier version. Superseded manual-evidence workflow materials are hidden from members.
8. **Restrictive classification defaults:** every existing document starts at the most restrictive level that still keeps current access the same. Nothing becomes more widely visible until an admin reviews its classification. Signatures and audit records are untouched.
9. **Third-party source permissions:** permission for Jared Odrick / NASCAR source materials is recorded separately from NDA verification: the source, the permitted use, who confirmed it, and the date.
10. **Server-side permissions:** every document and question check runs on the server (shared workstream access, individual restrictions, and who may edit as an admin). Hiding something on screen is never the only protection.

## Release gate

- No live invitations go out until Priority A acceptance testing confirms: correct legal names, candidate labels, NDA controls (including entity coverage), role restrictions, current Forum materials, and a working invitation process.
- Before release, confirm that the current Forum Protocol, Pre-Read and Conflict / Recusal forms are approved, correctly versioned, and reachable through the intended Stage 1 order. You confirm the approved versions, and I check that they are reachable.
- You get back an updated implementation checklist and the Priority A test results before production release.
- Priority B stays queued for the next release.
- Not authorized: redesign, rewriting documents, resetting records, or changing established governance authority.

## Priority B — Strategic Forum Center

- **New "Strategic Forum Center" page in the member portal.** Only Forum-cleared participants can open it, and the server enforces this. Initial Forum: "DIS–PRSC Motorsport Strategic Coordination Forum". It has five sections:
  - **A. Overview:** non-voting notice, the meeting and its calendar, the agenda version
  - **B. Executive Briefing:** versioned documents with acknowledgment, plus sanitized summaries
  - **C. Executive Questions:** up to 3 prioritized questions per round, with category, why it matters, suggested source and confidentiality. Nothing goes outside automatically.
  - **D. Forum Clearance:** your status and any restrictions
  - **E. Follow-Up:** the approved Coordination Note, your assigned tasks and open questions
- **Admin Question Register:** review, merge duplicates, group, set owner and priority, choose the source and route ([C]/[P]/[D]/[X]), track the six statuses, and export an approved list. Sharing anything outside the portal takes a separate admin action that is logged.
- **Coordination Dashboard:** the 7 workstreams, each with summary, evidence state, principal open question, next action, owner, target date, route and status. It has no voting, approval or certification features. Restricted [X] items appear only to authorized users.
- **Material classification:** each document gets one of five levels (General Orientation, Confidential Forum, Restricted Opportunity, Entity-Specific Confidential, Secretariat Only). The server enforces access, including per-person permission for Restricted Opportunity. The Restricted label alone does not allow anything to be uploaded or shared. Before an original third-party file (for example Jared Odrick / NASCAR material) can be stored or released, the admin must confirm and record the source's permission.
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
- **Rollback:** reverting the code must never reopen access. Database rules enforce NDA verification, classification and restrictions on their own, so older code still gets fail-closed results. Signatures, audit records and NDA restrictions are never deleted or reset.

## Open decisions (defaults are used unless you say otherwise)

- **Prohibited combinations:** the two-tier matrix above is the default until you confirm it against the operative legal documents.
- **Leadership panel:** by default it shows appointed members only.
- **Legal documents:** no redesign and no rewriting of legal documents. Only names and labels in the portal's own wording change.
