# Private Board & Advisor Center

## Product direction
Build a confidential, executive welcome center at `/portal`, visually guided by the supplied navy-and-gold dashboard reference and the uploaded build direction. The public PRSC site remains unchanged. Portal pages use their own navigation and footer treatment, are excluded from search indexing, and never expose private content before authentication.

The initial administrator will be `admin@readinessterminal.com`. Member and administrator emails will display `no-reply@readinessterminal.com` as sender, and portal questions will route to `info@readinessterminal.com`.

Build priority is member experience first, security second, and administrative convenience third. The member experience must retain the premium executive quality even where a simpler administrative implementation would be easier.

## Access and invitations
- Use invite-only email/password accounts; there is no public registration.
- The administrator creates one member at a time with name, email, organization, PRSC/DIS/Both designation, Board Member/Advisor role, and personalized “Why You” copy.
- Each invite sends a branded, single-use setup link. The member chooses a private password before entering.
- Include forgot-password, password reset, logout, expired-link, revoked-access, and unauthorized states.
- Enable leaked-password checks and require the current password for signed-in password changes.
- Keep authorization roles in a dedicated protected role record: `admin`, `board_member`, and `advisor`. Never infer access from email addresses or browser storage.
- Record successful sign-ins, failed access attempts where available, last access, invitation state, and revocation status without ever storing passwords.

## Member portal
- Desktop: compact top bar, persistent personal sidebar, and dense main canvas matching the supplied executive portal direction.
- Tablet/mobile: collapsible sidebar and persistent “Complete Private Profile” action.
- Views: Overview, PRSC, DIS, Your Role, What Happens Next, and Questions.
- Personalize the greeting, role/entity labels, package status, and “Why You” narrative. Member-facing language must correctly reflect PRSC, DIS, or Both.
- Keep PRSC refresh content concise and link to the public site for deeper reading.
- Present DIS as the Readiness Terminal™ and show the evidence-to-decision-intelligence flow plus the investor-prospecting milestone.
- Questions use a small private inquiry form, not the public FAQ. Members can view their own submitted inquiries and status only.

## Private profile experience
- Open as an accessible, full-screen private overlay, visually distinct from the shared portal.
- Four stages: Your Information, Your Experience, Visibility & Participation, and Final Details.
- Include all questions and permission choices from the supplied document, with conditional restriction details and a final review screen.
- Save each stage automatically so members can leave and return.
- Store headshots in private storage and serve them only through short-lived, authorized links.
- After submission, lock the completed version from casual edits, show “Profile received,” and update package status. The administrator can reopen it when corrections are needed.
- Clearly state that portal access and submission do not constitute appointment, acceptance, or legal agreement.
- Clearly separate profile permission selections from legal consent: they are informational instructions for preparing company and investor materials and do not replace any consent, release, confidentiality, appointment, or other provision in the later formal package.

## Administrator center
- Separate administrator-only area with overview counts and recent activity.
- Member management: create, invite, resend setup, edit personalization and PRSC/DIS/Both designation, revoke/reactivate access, reopen profiles, and inspect member status.
- Submission review: read completed profiles, permission selections, restrictions, contact requests, and privately view/download headshots.
- Inquiry management: read questions, mark open/resolved, add private internal notes, and reply outside the portal using the designated inquiry address.
- Activity view: invitation delivery state, first/last login, profile progress/submission, inquiries, and access changes.
- Email the administrator when a profile or inquiry is submitted; keep the authoritative record in the admin center.

## Email and domains
- Configure `readinessterminal.com` as the verified sending domain, using a delegated sending subdomain while displaying `no-reply@readinessterminal.com` everywhere.
- Create branded account invitation, recovery, and account-status emails using the managed delivery system and delivery logs.
- Create operational alerts for one submission or inquiry event at a time; no newsletter or bulk-campaign capability.
- Connect `access.prscstandards.com` to this project. The portal remains available at `/portal`; the subdomain entry point will send visitors directly there while preserving the existing `prscstandards.com` public site.

## Data and security
- Add private member profiles, role assignments, invitation/member status, saved profile responses, permission selections, inquiries, and access/activity events.
- Apply row-level rules so members can read/update only their own allowed records, while the sole administrator receives explicit administrator access.
- All protected reads and writes are revalidated on the server; hiding navigation is never treated as security.
- Use a private headshot bucket with member-scoped uploads and administrator-only review.
- Add rate limits and generic errors to sign-in, reset, inquiry, and invitation actions.
- Mark all portal, authentication, reset, and administrator pages `noindex, nofollow`; exclude them from sitemap and public navigation, footer, FAQ control, analytics content capture, and structured data.

## Visual and responsive treatment
- Use the project’s existing Guardian Navy, Council Gold, ivory, Cormorant Garamond, and Inter Tight system.
- Protect the supplied reference’s executive-briefing character: generous negative space, editorial typography, restrained gold accents, premium hierarchy, and exclusivity. Avoid conventional SaaS dashboard, CRM, or onboarding-portal patterns.
- Recreate the supplied reference as live interface elements rather than embedding the screenshot.
- The administrator area may be more utilitarian, but its implementation must never weaken member privacy or the premium member-facing experience.
- Add restrained photographic atmosphere only where it supports the welcome view; prioritize legibility and fast loading.
- Keyboard-accessible overlay, visible focus states, labeled controls, robust validation, upload progress/errors, and reduced-motion support.

## Delivery sequence
1. Configure invite-only authentication, password protections, protected storage, private data model, and administrator role.
2. Configure the `readinessterminal.com` sender and branded account/app emails.
3. Build sign-in, setup, reset, member portal, saved profile, and inquiry flows.
4. Build the administrator center and event alerts.
5. Connect `access.prscstandards.com`, verify host routing, and ensure the public PRSC site is unaffected.
6. Test member/admin isolation, invite and recovery flows, save-and-return, headshot privacy, submissions, alerts, mobile layouts, metadata exclusions, and logout/cache cleanup.

## Launch inputs still needed
Before final content polish, provide the first member list and each member’s designation and “Why You” copy. DNS approval will also be required when the sender and portal subdomain setup dialogs provide the exact records.
