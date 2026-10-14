export const INVITE_EMAIL_SUBJECT = "PRSC & DIS | Board & Advisor Center";
export const INVITE_EMAIL_SITE_NAME = "PRSC Board & Advisor Center";
export const INVITE_EMAIL_SENDER_DOMAIN = "notify.readinessterminal.com";
export const INVITE_EMAIL_FROM = `${INVITE_EMAIL_SITE_NAME} <no-reply@readinessterminal.com>`;
export const INVITE_EMAIL_REPLY_TO = "info@readinessterminal.com";
export const INVITE_EMAIL_PREVIEW_URL = "https://access.prscstandards.org/accept-invitation?preview-only=1";

export const INVITE_ROLE_LABELS = {
  board_member: "Board Member",
  advisor: "Advisor",
  prsc_board_dis_advisor: "Board Member (PRSC) and Advisor (DIS)",
  prsc_advisor_dis_board: "Advisor (PRSC) and Board Member (DIS)",
  methodology_committee: "Methodology Committee Member",
} as const;
