// Plain names for the Sent log. The send label is an internal code ("nudge-invite"); administrators read the name.

const NAMES: Record<string, string> = {
  "nudge-invite": "Reminder: invitation",
  "nudge-documents": "Reminder: documents",
  "nudge-profile": "Reminder: profile",
  "meeting-poll-invite": "Meeting availability request",
  "meeting-confirmed": "Meeting confirmed",
  "documents-ready-member": "Documents are ready",
  "documents-complete-member": "Documents complete",
  "entity-documents-ready": "Entity documents are ready",
  "journey-next-document": "Next document ready",
  "signed-copy-member": "Signed copy",
  "inquiry-member-autoreply": "Question received",
};

export const INVITATION_EMAIL_NAME = "Portal invitation";

export function emailLogName(label: string): string {
  if (NAMES[label]) return NAMES[label];
  if (label.startsWith("forum-")) return `Forum email: ${label.slice(6).replace(/[-_]/g, " ")}`;
  const words = label.replace(/[-_]/g, " ").trim();
  return words ? words.charAt(0).toUpperCase() + words.slice(1) : "Portal email";
}

/** Only an invitation (or its reminder) shows that a person has been invited; other notices do not. */
export function isInvitationEmailName(name: string): boolean {
  return name === INVITATION_EMAIL_NAME || name === NAMES["nudge-invite"];
}
