export const INVITE_EMAIL_SUBJECT = "PRSC & DIS | Board & Advisor Center";
export const INVITE_EMAIL_SITE_NAME = "PRSC Board & Advisor Center";
export const INVITE_EMAIL_SENDER_DOMAIN = "notify.readinessterminal.com";
export const INVITE_EMAIL_FROM = `${INVITE_EMAIL_SITE_NAME} <no-reply@notify.readinessterminal.com>`;
export const INVITE_EMAIL_REPLY_TO = "info@readinessterminal.com";
export const INVITE_EMAIL_PREVIEW_URL = "https://access.prscstandards.org/accept-invitation?preview-only=1";

export const INVITE_ROLE_LABELS = {
  board_member: "Board Candidate",
  advisor: "Advisor Candidate",
  prsc_board_dis_advisor: "PRSC Board / DIS Advisor",
  prsc_advisor_dis_board: "PRSC Advisor / DIS Board",
  methodology_committee: "Methodology Committee Candidate",
} as const;
