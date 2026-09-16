export type PortalDocument = {
  title: string;
  description: string;
  /** Public path to a downloadable PDF, or null while the document is being prepared. */
  href: string | null;
};

/**
 * Read & Retain: documents members download, review, and keep.
 * Replace `href` with a file in /public/downloads when each document is final.
 */
export const readAndRetainDocuments: PortalDocument[] = [
  {
    title: "Confidentiality & Non-Disclosure Notice",
    description: "How confidential PRSC and DIS information must be handled.",
    href: null,
  },
  {
    title: "Board & Advisor Code of Conduct",
    description: "Expectations for independence, conduct, and disclosure.",
    href: null,
  },
  {
    title: "Conflict of Interest Policy",
    description: "How potential conflicts are identified and managed.",
    href: null,
  },
];

/**
 * Sign & Return: documents completed through DocuSign only.
 * Replace `href` with the DocuSign envelope URL when each document is live.
 */
export const signAndReturnDocuments: PortalDocument[] = [
  {
    title: "Advisor / Board Appointment Agreement",
    description: "The formal terms of your appointment, executed electronically.",
    href: null,
  },
  {
    title: "Confidentiality Agreement",
    description: "Countersigned confidentiality terms for your engagement.",
    href: null,
  },
  {
    title: "Disclosure & Independence Statement",
    description: "Your attested disclosures and independence confirmation.",
    href: null,
  },
];
