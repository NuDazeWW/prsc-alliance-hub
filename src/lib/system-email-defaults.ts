// Original wording for automatic emails. Admins can edit these in the Email
// templates list; "Reset to original" restores the copy below.

export type SystemEmailCopy = {
  name: string;
  description: string;
  subject: string;
  eyebrow: string;
  heading: string;
  body: string;
  cta_label: string;
  cta_url: string;
  cta_subtext: string;
  signatures: string;
};

const FOUNDER = "Shirley Johnson, Founder, PRSC / DIS";
const PORTAL = "https://access.prscstandards.org/portal";

export const SYSTEM_EMAIL_DEFAULTS: Record<string, SystemEmailCopy> = {
  invite: {
    name: "Invitation (sent automatically)",
    description: "Sent automatically when you invite a member. Tokens: {{first_name}}, {{entity_full}}, {{entity}}, {{role}}.",
    subject: "PRSC & DIS | Board & Advisor Center",
    eyebrow: "Private invitation",
    heading: "Welcome, {{first_name}}!",
    body: "It's been a while since we spoke!\n\nYou're receiving this invitation because we aligned on your role at {{entity_full}} as a {{role}}.\n\nA great deal has happened behind the scenes. We've reached an important next stage—including DIS officially entering investor prospecting—and we're excited to reconnect and bring you into what comes next.\n\nWe've created a private {{entity}} Board & Advisor Welcome Center where you can quickly:\n\n• Get reacquainted with {{entity}} and see where we are today\n• Review why we're excited to have you involved\n• Provide a few details we need to prepare your individualized Board/Advisor package\n• Send us any questions before your formal materials are delivered\n\nWe're excited to reconnect and officially welcome you into this next chapter.",
    cta_label: "Access Your Private Welcome Center →",
    cta_url: "",
    cta_subtext: "After you click the button, you'll create your own private password on the secure invitation page. No password will be sent by email. Once your password is set, you'll enter the Welcome Center immediately.",
    signatures: "Shirley Johnson|Founder, Partnership Readiness Standards Council / Decision Intelligence Systems",
  },
  meeting_poll: {
    name: "Meeting availability request (automatic)",
    description: "Sent when you propose meeting dates. Tokens: {{first_name}}, {{meeting_title}}, {{meeting_type}}, {{meeting_block}}.",
    subject: "Please share your availability: {{meeting_title}}",
    eyebrow: "{{meeting_type}}",
    heading: "{{first_name}}, we are scheduling the next {{meeting_type}}.",
    body: "Because everyone carries a full corporate calendar, we are proposing a few time options and asking each member to mark what works.\n\n{{meeting_block}}\n\nIt takes under a minute: mark each option Available, If needed, or Unavailable.",
    cta_label: "Share Your Availability",
    cta_url: `${PORTAL}#meetings`,
    cta_subtext: "",
    signatures: FOUNDER,
  },
  meeting_confirmed: {
    name: "Meeting confirmed (automatic)",
    description: "Sent when you confirm a meeting time. Tokens: {{first_name}}, {{meeting_title}}, {{meeting_type}}, {{confirmed_time}}, {{meeting_duration}}, {{meeting_where}}, {{calendar_url}}.",
    subject: "Confirmed: {{meeting_title}} — {{confirmed_time}}",
    eyebrow: "{{meeting_type}}",
    heading: "{{first_name}}, the {{meeting_type}} is confirmed.",
    body: "Thank you for sharing your availability. The time that aligned best for the group is:\n\n{{confirmed_time}} ({{meeting_duration}} minutes)\n\n{{meeting_where}}\n\nUse the button below to add it directly to your Outlook, Apple, or Google calendar.",
    cta_label: "Add to My Calendar",
    cta_url: "{{calendar_url}}",
    cta_subtext: "Downloads a calendar file you can open with one click.",
    signatures: FOUNDER,
  },
  profile_received: {
    name: "Profile received (automatic)",
    description: "Sent to a member after they submit their profile. Tokens: {{first_name}}, {{role}}.",
    subject: "We've received your profile — next steps are being prepared",
    eyebrow: "Profile received",
    heading: "Thank you, {{first_name}}. Your profile has been received.",
    body: "Your private profile has been submitted successfully, and your individualized {{role}} package is now being prepared.\n\nYou will receive your next steps privately and shortly. There is nothing further you need to do at this time.\n\nIf any questions come to mind in the meantime, you can send them to us from the Welcome Center at any time — or simply reply to this email.",
    cta_label: "Return to Your Welcome Center",
    cta_url: PORTAL,
    cta_subtext: "Your Welcome Center shows your current status and any documents released to you.",
    signatures: FOUNDER,
  },
  documents_ready: {
    name: "Documents ready (automatic)",
    description: "Sent when you release a member's documents. Tokens: {{first_name}}, {{document_summary}}.",
    subject: "Action needed: your documents are ready",
    eyebrow: "Documents ready",
    heading: "{{first_name}}, your documents are ready.",
    body: "Your individualized package is now available in your private Welcome Center: {{document_summary}}.\n\nEverything is completed inside the portal. Open each document, read it, then initial or sign right there. It only takes a few minutes.",
    cta_label: "Review & Sign Your Documents",
    cta_url: PORTAL,
    cta_subtext: "Sign in with your email and the password you created.",
    signatures: FOUNDER,
  },
};
