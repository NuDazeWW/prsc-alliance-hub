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
    name: "Email 1 · Private invitation and orientation (sent automatically)",
    description: "Sent automatically when you invite a member. Tokens: {{first_name}}, {{why_you}}, {{entity_full}}, {{entity}}, {{role}}.",
    subject: "A private invitation to the next chapter of PRSC & DIS",
    eyebrow: "Private invitation",
    heading: "Hello {{first_name}},",
    body: "I'm pleased to welcome you to the next phase of our work with the Partnership Readiness Standards Council (PRSC) and Decision Intelligence Systems (DIS).\n\nWe've made meaningful progress in developing the independent readiness standard and the intelligence platform designed to support its adoption. As we prepare to bring our leadership and advisory community together for an important strategic discussion, I want to ensure everyone has a current understanding of what we're building, how the organizations work together, and where we're headed.\n\nWhy You're Here\n\n{{why_you}}\n\nWe've created a private Board & Advisor Center to make your experience straightforward, organized, and respectful of your time.\n\nHere's how to begin:\n\n• Accept your secure invitation and create your password\n• Start with the Orientation Hub and select \"Take the 5-Minute Orientation.\" This is an important first step, particularly as our framework has continued to evolve\n• Complete your private executive profile\n• Continue to your Forum preparation materials and meeting availability\n\nThe orientation will give everyone a common foundation so our upcoming discussion can focus on strategic questions, informed perspectives, and the opportunities ahead rather than revisiting introductory material.\n\nYou'll receive additional information about our upcoming Strategic Coordination Forum through the portal.\n\nThank you for being part of this next chapter. I look forward to bringing this group together and benefiting from the experience and perspective each of you brings.",
    cta_label: "Accept Your Private Invitation",
    cta_url: "",
    cta_subtext: "You'll create your own private password on the secure invitation page. No password is ever sent by email.",
    signatures: "Shirley Johnson|Founder, PRSC & DIS",
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

const SHIRLEY = "Shirley";
const FORUM_PORTAL = `${PORTAL}#meetings`;

function forum(name: string, description: string, subject: string, eyebrow: string, body: string, cta_label: string, cta_url = PORTAL): SystemEmailCopy {
  return { name, description, subject, eyebrow, heading: "Hello {{first_name}},", body, cta_label, cta_url, cta_subtext: "", signatures: SHIRLEY };
}

Object.assign(SYSTEM_EMAIL_DEFAULTS, {
  forum_confirmed: forum("Email 2 · Forum confirmed", "Sent from Forum Communications once the date is set. Tokens: {{first_name}}, {{forum_date}}, {{forum_time}}, {{forum_location}}.",
    "Confirmed: DIS–PRSC Motorsport Strategic Coordination Forum", "Strategic Coordination Forum",
    "Our inaugural DIS–PRSC Motorsport Strategic Coordination Forum is now scheduled.\n\nDate: {{forum_date}}\nTime: {{forum_time}}\nLocation: {{forum_location}}\n\nThis confidential session will bring together our invited leadership, advisors, and methodology experts to examine an emerging motorsport opportunity, its implications for the Readiness Vanguard, and the path toward credible market validation.\n\nThe Forum is designed for strategic coordination and expert input. It is not a formal Board or Methodology Committee meeting, and no entity approvals or votes will occur.\n\nYour meeting information, preparation requirements, and calendar invitation are available in the private portal.\n\nIf you have not yet completed the five-minute Orientation Hub overview, please do so before the session.\n\nI look forward to a productive conversation.",
    "View Forum Details", FORUM_PORTAL),
  briefing_released: forum("Email 3 · Strategic briefing released", "Sent from Forum Communications to cleared members who can see the briefing. Tokens: {{first_name}}.",
    "Your confidential strategic briefing is available", "Executive briefing",
    "Our confidential strategic briefing is now available in the PRSC & DIS Private Board & Advisor Center.\n\nThe briefing outlines the emerging motorsport opportunity, the strategic questions it presents for DIS and PRSC, and its potential implications for the Readiness Vanguard and independent market validation.\n\nIt also distinguishes established facts from reported information and working hypotheses.\n\nPlease review the materials before submitting your strategic questions. The purpose of this advance briefing is to give everyone the opportunity to engage with the substance of the discussion before we convene.\n\nThese materials are confidential and intended only for authorized recipients.\n\nThank you for contributing your perspective.",
    "Review the Executive Briefing", `${PORTAL}#documents`),
  input_requested: forum("Email 4 · Executive input requested (available in Priority B)", "Switched off until the question workspace is live. Tokens: {{first_name}}, {{deadline}}.",
    "Your perspective ahead of the Strategic Coordination Forum", "Executive input",
    "Now that the executive briefing is available, I'd like to invite your perspective ahead of our upcoming Strategic Coordination Forum.\n\nOne of the reasons we've brought together this group is the breadth of expertise represented. Your questions are just as valuable as your recommendations, particularly as we examine an opportunity with meaningful strategic, operational, and institutional implications.\n\nThrough the portal, please submit up to three questions you believe we should address before or during the Forum.\n\nThese might relate to market opportunity, commercial positioning, data and measurement, methodology, technology, governance, or execution priorities.\n\nWe'll consolidate the questions, identify the appropriate information sources, and use them to focus the discussion. Questions intended for Jared or another external party will be reviewed and coordinated before being shared.\n\nRequested by: {{deadline}}\n\nThank you for helping make this a substantive and productive discussion.",
    "Submit Your Executive Questions"),
  input_reminder: forum("Email 5 · Input reminder (available in Priority B)", "Switched off until the question workspace is live. Goes only to members who have not responded. Tokens: {{first_name}}, {{deadline}}.",
    "Reminder: Forum questions close {{deadline}}", "Executive input",
    "A quick reminder that the window for submitting questions ahead of our Motorsport Strategic Coordination Forum closes on {{deadline}}.\n\nWe're consolidating input from the group to identify information gaps, strengthen the discussion, and ensure we make the best use of everyone's time.\n\nIf you have one or two questions you believe we should explore, we'd welcome them.\n\nIf you have no additional questions at this stage, no submission is required.",
    "Submit Questions"),
  final_agenda: forum("Email 6 · Final Forum agenda", "Sent from Forum Communications about two business days before the Forum. Tokens: {{first_name}}, {{forum_when}}.",
    "Final preparation: Strategic Coordination Forum", "Final agenda",
    "Our Strategic Coordination Forum is approaching, and the final preparation materials are now available.\n\nYour private portal contains the current agenda, the executive coordination dashboard, and the key questions we will address together.\n\nForum: {{forum_when}}\n\nBefore we meet, please:\n\n• Review the current agenda and coordination dashboard\n• Review any new or revised materials assigned to you\n• Confirm that your Forum participation and conflict disclosures remain accurate\n\nOur objective is to use the session to challenge assumptions, explore strategic options, and identify a practical path forward.\n\nNo formal entity decisions or approvals will occur during this joint Forum. Matters requiring PRSC or DIS authorization will be routed to their respective processes.\n\nI'm looking forward to the conversation.",
    "Review Final Forum Materials"),
  coordination_summary: forum("Email 7 · Forum coordination summary", "Sent from Forum Communications after the approved Coordination Note is released. Tokens: {{first_name}}.",
    "Forum Coordination Summary now available", "Coordination summary",
    "Thank you for contributing to our DIS–PRSC Motorsport Strategic Coordination Forum.\n\nI appreciate the thoughtful perspectives and expertise brought into the discussion.\n\nThe approved Coordination Summary is now available in your private portal. It captures the principal discussion themes, outstanding questions, agreed coordination actions, and matters requiring separate review or authorization.\n\nPlease note that the summary records strategic coordination, not formal PRSC or DIS corporate action.\n\nWe'll continue communicating through the portal as the next steps develop.\n\nThank you again for your involvement.",
    "Review the Coordination Summary", `${PORTAL}#documents`),
  followup_assigned: forum("Email 8 · Follow-up assignment (available in Priority B)", "Switched off until follow-up assignments are live. Tokens: {{first_name}}, {{action_title}}, {{target_date}}, {{coordinating_entity}}.",
    "A Forum follow-up has been assigned to you", "Follow-up",
    "A follow-up item from the DIS–PRSC Strategic Coordination Forum has been assigned to you in the private portal.\n\nAction: {{action_title}}\nTarget Date: {{target_date}}\nCoordinating Entity: {{coordinating_entity}}\n\nYou can review the context, expected contribution, and any supporting materials in your Forum workspace.\n\nIf the assignment requires formal entity authority, approval, or access beyond your current role, please flag it through the portal before proceeding.\n\nThank you for your continued contribution.",
    "View Your Follow-Up"),
} satisfies Record<string, SystemEmailCopy>);
