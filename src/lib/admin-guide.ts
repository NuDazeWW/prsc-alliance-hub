export type GuideEntry = { id: string; group: string; title: string; summary: string; steps: string[]; tips?: string[]; keywords?: string };

/** Plain-language instructions for administrators. Searched by the Admin guide in the left bar. */
export const ADMIN_GUIDE: GuideEntry[] = [
  {
    id: "getting-around", group: "Start here", title: "Getting around the admin area",
    summary: "Where everything lives and how the page is laid out.",
    steps: [
      "Use the left bar for every action. Each link opens the right card and scrolls to it, even if that card was folded.",
      "The links are grouped: People, Communications, Questionnaires, Documents & releases, and Everything else.",
      "The numbers across the top (Members, Open inquiries, Communications, Recent events) are shortcuts too. Click one to jump to it.",
      "Each card has a round arrow button at its top right. Click it to fold or unfold the card. Cards start folded and remember what you opened.",
      "Overview holds members, meetings, documents, inquiries and activity. Invite & Email holds invitations, composing and sending, forum emails and the sent log.",
    ],
    tips: ["After a change goes live, reload the page once so you see the newest version."],
    keywords: "navigate menu left bar cards fold collapse caret arrow shortcuts layout",
  },
  {
    id: "invite-member", group: "People", title: "Invite one member",
    summary: "Send a private invitation to a single person.",
    steps: [
      "Left bar: People > Invite a member.",
      "Enter first name, last name and email. Choose the role and the organization (PRSC, DIS, both, or Forum-only).",
      "Click the preview button to see the exact email the person will receive.",
      "Use Send a test (in the preview) to send it to your own address first. Never use a real invitee's address to test.",
      "When you are ready, click Send invitation. The person gets a secure link and creates their own password. No password is ever emailed.",
    ],
    tips: ["Invitations use the invitation template. To change its wording, see Edit an email template."],
    keywords: "invitation invite add member send new person",
  },
  {
    id: "upload-list", group: "People", title: "Add many members from a list",
    summary: "Upload a spreadsheet instead of typing people in one at a time.",
    steps: [
      "Left bar: People > Upload a member list.",
      "Download the list template, fill it in, and upload it. Roles must match the allowed names (PRSC Board, PRSC Advisor, DIS Board, DIS Advisor, Other, or Forum invitee).",
      "Review the people shown. They are only staged in your browser. Nothing is saved yet.",
      "Click Add to save them without emailing, or Add & invite to save and send invitations.",
    ],
    keywords: "csv spreadsheet bulk import upload roster",
  },
  {
    id: "members", group: "People", title: "Find a member and see where they are",
    summary: "Check progress, documents and status for any person.",
    steps: [
      "Left bar: People > Members. The list shows each person's status and progress.",
      "Click a person to open their details, documents and history.",
      "To remove someone, use the checkboxes and Remove selected members. Their records are kept.",
    ],
    keywords: "tracker roster status progress remove delete revoke",
  },
  {
    id: "forum-invitations", group: "People", title: "Prepare Forum invitations",
    summary: "Invite people who are joining the Forum only.",
    steps: [
      "Left bar: Invite & Email page, then the Prepare saved Forum invitations card (unfold it).",
      "Save the people as Forum invitees with no organization role.",
      "Review each person's details and the NDA, then send.",
    ],
    keywords: "forum only invitee readiness vanguard coordination forum",
  },
  {
    id: "compose-send", group: "Communications", title: "Compose and send an email",
    summary: "Write a message and send it to chosen people.",
    steps: [
      "Left bar: Communications > Compose & send.",
      "Pick people in the recipient list. Use the search box to find them by name or email.",
      "Start from a saved template or write your own. Fields like {{first_name}} fill in each person's details.",
      "Open Preview, and use Pop out full size to see it at normal size.",
      "Send a test to any address first, for example your own. Then click Send.",
    ],
    tips: ["Every email sent to a member is recorded in the Sent log."],
    keywords: "email message write send recipients test preview",
  },
  {
    id: "edit-template", group: "Communications", title: "Edit an email template",
    summary: "Change the wording of an automatic or saved email.",
    steps: [
      "Left bar: Communications > Email templates (the Template library editor).",
      "Pick a template on the left. Automatic emails (invitation, reminders, agenda notices) are marked as automatic.",
      "Change the subject, heading, body, button label and signature, then Save template.",
      "Use Preview to check it. To go back to the original wording, use Restore original wording.",
    ],
    tips: [
      "In the invitation body: **text** makes bold, *text* makes italic.",
      "A line with only [steps] marks where the Your Next Steps panel and button appear. A paragraph starting with [footer] prints small and italic at the bottom.",
      "Allowed merge fields in the invitation: {{first_name}}, {{full_name}}, {{entity_full}}, {{entity}}, {{role}}, {{email}}. Anything else prints as typed.",
    ],
    keywords: "template wording copy invitation reset restore subject signature bold italic merge fields",
  },
  {
    id: "new-template", group: "Communications", title: "Create a new template",
    summary: "Save a reusable email.",
    steps: [
      "Left bar: Communications > Create a template.",
      "Give it a name, subject, heading and body. Add a button label and link if you want a button.",
      "Preview it, then Save template. It then shows up in Compose & send.",
    ],
    keywords: "new template create save reusable upload",
  },
  {
    id: "forum-emails", group: "Communications", title: "Send Forum emails",
    summary: "The numbered Forum emails (confirmed, briefing, questions, reminder, agenda).",
    steps: [
      "Left bar: Communications > Forum emails.",
      "Choose the email, fill in the details it asks for (dates, deadline, document, or question round).",
      "The list shows who qualifies. Anyone who does not qualify shows the reason.",
      "Preview, then send. Each person gets their own email linking into the portal.",
    ],
    tips: ["Executive questions requested (Email 4) opens the questions pop-up in the portal. The reminder goes only to people who have not answered."],
    keywords: "forum communications email 1 2 3 4 5 6 confirmed briefing questions reminder agenda",
  },
  {
    id: "sent-log", group: "Communications", title: "Check what was sent",
    summary: "See every email sent to members and whether it was delivered.",
    steps: [
      "Left bar: Communications > Sent log.",
      "Search by person or email. Failed sends show the reason.",
      "Use the download button to save the log as a spreadsheet.",
    ],
    keywords: "sent log history delivered failed delivery export csv",
  },
  {
    id: "clear-member", group: "Documents & releases", title: "Clear a member for the Forum",
    summary: "The last step before a member sees the agenda and the strategy brief.",
    steps: [
      "Left bar: People > Members, then open the person.",
      "Confirm they signed the Confidentiality Addendum and verify the NDA.",
      "Review their conflict / recusal answer.",
      "Record the clearance decision (cleared, cleared with restrictions, escalated or declined). Restrictions need a written note.",
      "When someone is cleared, the portal grants the restricted strategy brief and emails them the agenda with Open the Forum Agenda and Read the Strategy Brief buttons.",
    ],
    keywords: "clearance cleared nda addendum conflict recusal restricted brief strategy agenda",
  },
  {
    id: "agenda", group: "Documents & releases", title: "Publish or change the Forum agenda",
    summary: "Release the agenda and tell people when it changes.",
    steps: [
      "Left bar: Documents & releases > Documents. Upload the agenda and mark it as the Forum agenda.",
      "To change it, replace the PDF. Members always see the newest version.",
      "On the agenda row, click Email cleared members: agenda updated. A confirmation shows how many people will be emailed.",
    ],
    keywords: "agenda upload replace update notify cleared members documents pdf",
  },
  {
    id: "release-review", group: "Documents & releases", title: "Release review",
    summary: "Approve documents before members can see them.",
    steps: [
      "Left bar: Documents & releases > Release review.",
      "Open each item, read it, and approve or hold it.",
    ],
    keywords: "approve release review hold documents stage",
  },
  {
    id: "questions", group: "Questionnaires", title: "Run an executive questions round",
    summary: "Collect questions from members and prepare a list for Jared.",
    steps: [
      "Left bar: Questionnaires > Executive questions. Create a round with a title, open date and deadline.",
      "Send Forum email 4 (Communications > Forum emails) so members get the link. Members answer in a pop-up in the portal.",
      "You receive an email as each member submits, with their questions.",
      "In the register, group similar questions. Mark each group for the Jared list or the internal list.",
      "Click Prepare from Jared list, then Record founder approval. Mark as shared only after you have sent the list yourself.",
      "Paste Jared's answers into Responses received and save.",
    ],
    tips: ["Nothing is ever emailed to Jared or any outside party by the portal. You send the approved list yourself."],
    keywords: "executive questions jared round register group outbound approval shared responses questionnaire",
  },
  {
    id: "meetings", group: "Everything else", title: "Meetings and availability polls",
    summary: "Ask members for availability and confirm a time.",
    steps: [
      "Left bar: Meetings.",
      "Create a meeting poll with the proposed times and who it goes to.",
      "Members mark availability in the portal. A reminder goes to people who have not answered after 48 hours.",
      "When a time works for everyone, confirm it from the meeting card. The portal handles the confirmation notices.",
    ],
    keywords: "meeting poll availability calendar schedule reminder confirm",
  },
  {
    id: "inquiries", group: "Everything else", title: "Answer inquiries",
    summary: "Messages sent by visitors and members.",
    steps: [
      "Left bar: Inquiries (or click Open inquiries at the top).",
      "Open a message and read it. Reply from your own email, then update its status in the list.",
    ],
    keywords: "inquiry message contact reply handled",
  },
  {
    id: "activity", group: "Everything else", title: "Activity log",
    summary: "A dated record of what happened and who did it.",
    steps: [
      "Left bar: Activity log.",
      "Use it to see invitations, signatures, documents released, clearances and emails sent.",
    ],
    keywords: "activity history audit log events record",
  },
  {
    id: "leadership", group: "People", title: "Leadership team panel",
    summary: "Edit the Our Leadership Team panel members see.",
    steps: [
      "Left bar: People > Leadership team.",
      "Add or edit a person, change the order with the arrows, and use the eye button to show or hide them.",
      "Link a person to a portal member to fill in their photo and bio, if their permissions allow it.",
    ],
    keywords: "leadership team panel photo bio welcome center",
  },
  {
    id: "account", group: "Start here", title: "Your account and other administrators",
    summary: "Change your password, add an administrator, sign out.",
    steps: [
      "Click your name at the top of the left bar.",
      "Choose Change password, Manage administrators or Sign out.",
    ],
    keywords: "password admin administrator account sign out add remove",
  },
  {
    id: "safe-testing", group: "Start here", title: "Testing safely before real people get anything",
    summary: "How to try an email without sending it to invitees.",
    steps: [
      "Every preview has a Send a test box. Use your own address.",
      "Open the test in both Gmail and Outlook to check how it looks.",
      "Only click Send to members after the test looks right.",
    ],
    tips: ["Test emails carry a [TEST] prefix in the subject."],
    keywords: "test safe preview send a test try before sending",
  },
  {
    id: "not-showing", group: "Start here", title: "Something is missing or looks old",
    summary: "What to check first.",
    steps: [
      "Reload the page. Changes only appear after they are published.",
      "If a card looks empty, click the arrow at its top right to unfold it.",
      "If an automatic email still has old wording, open Email templates, pick it, and choose Restore original wording.",
    ],
    keywords: "missing old stale not updated problem troubleshoot publish",
  },
];
