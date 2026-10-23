import type { JourneyTrack } from "./journey";

export type JourneyPreset = {
  stage: 1 | 2 | 3 | 4 | 5;
  track: JourneyTrack;
  category: "sign" | "read";
  title: string;
  description: string;
};

// Canonical document names for the five-part journey. The NDA is a verified
// prerequisite before invitation, so it is not a journey document.
export const JOURNEY_PRESETS: JourneyPreset[] = [
  { stage: 1, track: "shared", category: "read", title: "Readiness Vanguard Coordination Forum Protocol", description: "Read and acknowledge before the first Forum" },
  { stage: 1, track: "shared", category: "read", title: "Readiness Vanguard Forum Pre-Read Packet", description: "Entity Architecture Diagram, PRSC–DIS License & Authority Boundary Summary, Coordination Forum agenda (no vote or entity authority), and the published PRSC Readiness Standard™ overview" },
  { stage: 1, track: "shared", category: "sign", title: "Conflict / Recusal Confirmation", description: "Disclose any new or changed conflict before the relevant session" },
  { stage: 2, track: "prsc", category: "read", title: "PRSC Governance Charter & PRSC Readiness Standard™", description: "Core PRSC orientation materials" },
  { stage: 2, track: "prsc", category: "read", title: "Entity Architecture & Controlled License Summary", description: "How PRSC and DIS relate and what the license permits" },
  { stage: 2, track: "prsc", category: "read", title: "PRSC Role Orientation Brief", description: "Board, Committee, or Advisor role materials" },
  { stage: 2, track: "dis", category: "read", title: "Controlled PRSC–DIS Boundary Summary", description: "The authority boundary between PRSC and DIS" },
  { stage: 2, track: "dis", category: "read", title: "DIS Role Brief", description: "Your DIS founder, contributor, or advisor role" },
  { stage: 2, track: "dis", category: "read", title: "DIS Platform, Security & Data Materials", description: "Only the materials needed for your role" },
  { stage: 3, track: "prsc", category: "sign", title: "PRSC Board / Committee / Advisor Agreement", description: "Your PRSC role agreement" },
  { stage: 3, track: "prsc", category: "sign", title: "Initial Conflict of Interest Disclosure", description: "Your initial PRSC COI disclosure" },
  { stage: 3, track: "prsc", category: "sign", title: "Contribution Assignment", description: "Only where actually needed" },
  { stage: 3, track: "dis", category: "sign", title: "DIS Role Agreement", description: "Founder PIIA, services / development agreement, or advisor agreement" },
  { stage: 3, track: "dis", category: "sign", title: "Confidentiality & Invention-Assignment Terms", description: "DIS confidentiality and invention-assignment terms" },
  { stage: 3, track: "dis", category: "sign", title: "Cross-Entity Disclosure", description: "Only if triggered" },
  { stage: 4, track: "prsc", category: "read", title: "PRSC Appointment Record", description: "Board or Committee appointment record after authorized PRSC countersignature" },
  { stage: 4, track: "dis", category: "read", title: "DIS Activation Record", description: "Corporate authority verification, countersignature, and approved system / data access" },
  { stage: 5, track: "shared", category: "read", title: "Forum Agenda, Data-Classification Reminder & Proposed Action Log", description: "Read before every Forum" },
  { stage: 5, track: "prsc", category: "sign", title: "Annual COI & Revenue Firewall Certification", description: "Annual PRSC certification" },
  { stage: 5, track: "prsc", category: "sign", title: "PRSC Stipend or Honorarium Addendum", description: "Conditional PRSC addendum" },
  { stage: 5, track: "dis", category: "sign", title: "DIS Equity or Compensation Action", description: "Equity Plan, option grant, employment conversion, or financing documents" },
];
