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

const FOUNDER = "Shirley Johnson";
// Only the first email of a journey (the invitation, and entity onboarding) comes from the founder; everything after is from the team.
const TEAM = "The PRSC Leadership Team";
const PORTAL = "https://access.prscstandards.org/portal";

/** Older saved versions of the invitation that should be replaced by the current default copy. */
export function isOutdatedSavedInvite(key: string | null | undefined, body: string | null | undefined) {
  if (key !== "invite" || !body) return false;
  return /next phase of our work|It's been a while since we spoke|It’s been a while since we spoke|Hello \{\{first_name\}\}/i.test(body) && !/Readiness Vanguard Coordination Forum/.test(body);
}

export const SYSTEM_EMAIL_DEFAULTS: Record<string, SystemEmailCopy> = {
  invite: {
    name: "Email 1 · Private invitation and orientation (sent automatically)",
    description: "Sent automatically when you invite a member. Tokens: {{first_name}}, {{why_you}}, {{entity_full}}, {{entity}}, {{role}}.",
    subject: "A private invitation to the next stage of Motorsport Partnership Readiness",
    eyebrow: "Private invitation",
    heading: "Hi {{first_name}},",
    body: "A private invitation to the next stage of Motorsport Partnership Readiness.\n\nIt has been a while since we connected, and we have been advancing the work behind the PRSC Readiness Standard™, the PRSC Readiness Score™, and the Readiness Vanguard.\n\nPRSC and DIS have distinct but complementary roles. **The Partnership Readiness Standards Council** (PRSC) governs the independent Standard, the official Score, methodology stewardship, and market-trust safeguards. Under a separate arm’s-length license, **Decision Intelligence Systems** (DIS) is developing the Readiness Terminal™—the technology and intelligence layer that operationalizes readiness intelligence at scale.\n\nWe are convening the inaugural **Readiness Vanguard Coordination Forum** to bring together a select group of leaders and subject-matter experts for a timely discussion at the intersection of motorsport, partnership readiness, and decision intelligence.\n\nWe are seeking your independent perspective, strategic judgment, and practical experience.\n\nWe know it has been a while since we connected. The timing matters because a significant motorsport opportunity has emerged—one that may help us test how the Readiness Vanguard can demonstrate the value of a shared readiness language in a real market context.\n\n**Your Access Center**\n\nWe’ve created a private Forum Center to make your participation straightforward, organized, and respectful of your time. It provides the common context needed for a productive discussion while the appropriate PRSC and DIS boundaries remain clear.\n\n[steps]\n\nThank you for being part of this next chapter. I'm looking forward to bringing this group together and benefiting from the experience and perspective each of you brings.\n\n[footer] *The Forum is not being asked to approve a deal or make a formal entity decision. It is a confidential coordination session designed to surface informed perspective, clarify the opportunity, and identify the appropriate next steps for PRSC and DIS through their separate processes.*",
    cta_label: "Accept Your Private Invitation",
    cta_url: "",
    cta_subtext: "You'll create your own private password on the secure invitation page. No password is ever sent by email.",
    signatures: "Shirley Johnson",
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
    signatures: TEAM,
  },
  meeting_poll_reminder: {
    name: "Meeting availability reminder (automatic)",
    description: "Sent once, 48 hours after a poll opens, only to invited members who have not answered. Tokens: {{first_name}}, {{meeting_title}}.",
    subject: "Quick reminder: your availability for {{meeting_title}}",
    eyebrow: "Gentle reminder",
    heading: "{{first_name}}, we are still collecting availability.",
    body: "We are finding a time for \"{{meeting_title}}\" and your answer is one of the few still outstanding.\n\nIt takes under a minute — open your private Welcome Center, go to Meetings, and mark each proposed time Available, If needed, or Unavailable.",
    cta_label: "Share Your Availability",
    cta_url: `${PORTAL}#meetings`,
    cta_subtext: "",
    signatures: TEAM,
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
    signatures: TEAM,
  },
  profile_received: {
    name: "Profile received (automatic)",
    description: "Sent to a member after they submit their profile. Role-neutral: suitable for Forum-only participants, candidates, pending appointees, and appointed members. Tokens: {{first_name}}.",
    subject: "We've received your executive profile",
    eyebrow: "Profile received",
    heading: "Thank you, {{first_name}}. Your profile has been received.",
    body: "Your private executive profile has been submitted successfully and recorded securely in the Board & Advisor Center.\n\nYour Welcome Center always shows your current status and anything that needs your attention — including meeting availability and Forum participation requirements when they apply to you.\n\nIf any questions come to mind, you can send them to us at any time through the Questions section of your Welcome Center.",
    cta_label: "Return to Your Welcome Center",
    cta_url: PORTAL,
    cta_subtext: "Your Welcome Center shows your current status and any documents released to you.",
    signatures: TEAM,
  },
  entity_documents_ready: {
    name: "Entity onboarding materials available (automatic)",
    description: "Sent once when an admin starts a member's PRSC or DIS Stage 2 onboarding. Tokens: {{first_name}}, {{entity}}, {{stage_name}}, {{action_summary}}, {{due_date}}.",
    subject: "Your {{entity}} Onboarding Materials Are Available",
    eyebrow: "{{entity}} onboarding",
    heading: "Hello {{first_name}},",
    body: "Your next onboarding materials for your proposed {{entity}} role are now available in the Private Board & Advisor Center.\n\nWe've organized these materials in stages so that you can review and complete the appropriate requirements without receiving a large document package by email.\n\nCurrent step: {{stage_name}}\nAction requested: {{action_summary}}\n\nThese steps relate to your intended role. Formal appointment and associated authority remain subject to the applicable agreements, organizational decisions, and recorded activation requirements.\n\nThank you for your continued engagement.",
    cta_label: "Review My Onboarding Materials",
    cta_url: PORTAL,
    cta_subtext: "",
    signatures: FOUNDER,
  },
  profile_submitted_admin_alert: {
    name: "Profile submitted, admin alert (automatic)",
    description: "Sent to the administrator when a member submits their Executive Profile. Tokens: {{member_name}}, {{submitted_at}}, {{submission_id}}.",
    subject: "Executive Profile Submitted | {{member_name}}",
    eyebrow: "Administrative notice",
    heading: "An executive profile submission has been recorded.",
    body: "Member: {{member_name}}\nRecorded at: {{submitted_at}}\nSubmission reference: {{submission_id}}\n\nReview the member's profile and any applicable administrative next steps in the Admin Center.\n\nThis is an administrative notification, not a request to approve or activate an appointment.",
    cta_label: "View Member Record",
    cta_url: "https://access.prscstandards.org/admin",
    cta_subtext: "",
    signatures: "",
  },
  documents_ready: {
    name: "Forum documents ready (forum_documents_ready, automatic)",
    description: "Sent once when you release a member's initial Forum Protocol, Pre-Read and Conflict/Recusal documents. PRSC/DIS Stage 2 uses Entity onboarding instead. Tokens: {{first_name}}, {{document_summary}}.",
    subject: "Action needed: your Forum materials are ready",
    eyebrow: "Documents ready",
    heading: "{{first_name}}, your Forum materials are ready.",
    body: "Your Forum participation materials are now available in your private Welcome Center: {{document_summary}}.\n\nEach item shows you what is needed — some ask you to review and acknowledge, others ask for a disclosure or a signature. Everything is completed inside the portal, and each step takes only a few minutes.",
    cta_label: "Review My Forum Requirements",
    cta_url: `${PORTAL}#documents`,
    cta_subtext: "Sign in with your email and the password you created.",
    signatures: TEAM,
  },
  forum_agenda_ready: {
    name: "Forum agenda available (automatic)",
    description: "Sent once to a member when you clear them for the Forum and an Agenda is published. Tokens: {{first_name}}.",
    subject: "You're cleared: the Forum agenda is now available",
    eyebrow: "Forum agenda",
    heading: "{{first_name}}, you're cleared for the Forum.",
    body: "Thank you for completing your preparation. The inaugural Forum agenda is now available in your private Welcome Center.\n\nIt opens at the top of your Documents page. There is nothing to sign. We will email you if the agenda changes.",
    cta_label: "Open the Forum Agenda",
    cta_url: `${PORTAL}#documents`,
    cta_subtext: "Sign in with your email and the password you created.",
    signatures: TEAM,
  },
  forum_agenda_updated: {
    name: "Forum agenda updated (sent by an administrator)",
    description: "Sent to cleared Forum members when an administrator chooses to announce a change to the agenda. Tokens: {{first_name}}.",
    subject: "The Forum agenda has been updated",
    eyebrow: "Forum agenda",
    heading: "{{first_name}}, the Forum agenda has changed.",
    body: "We have updated the Forum agenda. The latest version is now in your private Welcome Center under Documents.\n\nNothing is needed from you beyond reviewing the changes.",
    cta_label: "Open the Forum Agenda",
    cta_url: `${PORTAL}#documents`,
    cta_subtext: "",
    signatures: TEAM,
  },
};

const SHIRLEY = TEAM;
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
  input_requested: forum("Email 4 · Executive questions requested", "Sent from Forum Communications for one question round, only to cleared participants with briefing access. Tokens: {{first_name}}, {{round_title}}, {{deadline}}.",
    "Your perspective ahead of the Strategic Coordination Forum: {{round_title}}", "Executive input",
    "Now that the executive briefing is available, I'd like to invite your perspective ahead of our upcoming Strategic Coordination Forum.\n\nOne of the reasons we've brought together this group is the breadth of expertise represented. Your questions are just as valuable as your recommendations, particularly as we examine an opportunity with meaningful strategic, operational, and institutional implications.\n\nThrough the portal, please submit up to three questions you believe we should address before or during the Forum.\n\nThese might relate to market opportunity, commercial positioning, data and measurement, methodology, technology, governance, or execution priorities.\n\nWe'll consolidate the questions, identify the appropriate information sources, and use them to focus the discussion. Questions intended for Jared or another external party will be reviewed and coordinated before being shared.\n\nQuestion round: {{round_title}}\nRequested by: {{deadline}}\n\nThank you for helping make this a substantive and productive discussion.",
    "Submit Your Executive Questions", `${PORTAL}#executive-questions`),
  input_reminder: forum("Email 5 · Executive questions reminder", "Goes only to eligible members who have not submitted or chosen No additional questions. Tokens: {{first_name}}, {{round_title}}, {{deadline}}.",
    "Reminder: {{round_title}} questions close {{deadline}}", "Executive input",
    "A quick reminder that the window for submitting questions ahead of our Motorsport Strategic Coordination Forum closes on {{deadline}}.\n\nWe're consolidating input from the group to identify information gaps, strengthen the discussion, and ensure we make the best use of everyone's time.\n\nIf you have one or two questions you believe we should explore, we'd welcome them.\n\nIf you have no additional questions at this stage, no submission is required.",
    "Submit Questions", `${PORTAL}#executive-questions`),
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
