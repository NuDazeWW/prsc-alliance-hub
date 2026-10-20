// Structured source of truth for the Board & Advisor Orientation Hub.
// Copy comes only from the approved Orientation Hub content specification.

export type Tone = "prsc" | "dis" | "bridge";

export type Block =
  | { kind: "p"; text: string }
  | { kind: "quote"; text: string }
  | { kind: "list"; title?: string; items: string[] }
  | { kind: "soon"; items: string[] }
  | { kind: "label"; text: string }
  | { kind: "relationship" }
  | { kind: "dimensions" }
  | { kind: "audiences" }
  | { kind: "intelligence" }
  | { kind: "availability" }
  | { kind: "ipstack" }
  | { kind: "competitive" }
  | { kind: "flywheel" }
  | { kind: "pairs"; rows: { term: string; text: string }[] }
  | { kind: "callout"; title?: string; text: string };

export type Topic = { id: string; title: string; heading: string; tone: Tone; blocks: Block[]; links?: string[] };

export const SITE_LINKS: { id: string; label: string; href?: string; topic?: string }[] = [
  { id: "score", label: "PRSC Readiness Score™ — The Standard", href: "/the-standard" },
  { id: "governance", label: "Governance", href: "/governance" },
  { id: "charter", label: "Governance Charter", href: "/governance/charter" },
  { id: "standards", label: "Written Standards", href: "/governance/written-standards" },
  { id: "vanguard", label: "The Readiness Vanguard™", topic: "vanguard" },
  { id: "vanguard-site", label: "Readiness Vanguard™ public page", href: "/readiness-vanguard" },
];
export type TopicGroup = { id: string; letter: string; title: string; topics: Topic[] };

export const COMPETITIVE_CONTEXT = [
  { category: "Media and sponsorship measurement tools", does: "Measure exposure, content, media value, or campaign results.", adds: "A governed readiness standard and private PRSC Readiness Score™ before and beyond one campaign." },
  { category: "Sponsorship-management platforms", does: "Manage rights, assets, deals, and reporting.", adds: "Commercial-readiness and benchmark intelligence." },
  { category: "Agencies, agents, and brokers", does: "Sell, negotiate, introduce, or manage deals.", adds: "Neutral measurement and decision support—not deal facilitation." },
  { category: "Traditional sponsorship decks", does: "Tell a property’s story.", adds: "Comparable, evidence-led commercial-readiness context." },
];

export const HUB_TITLE = "Welcome to the PRSC & DIS Orientation Hub";
export const HUB_INTRO =
  "This hub is a shared reference point for individuals guiding PRSC and DIS. The hub explains the problem being solved, how the two organizations work together, what the PRSC Readiness Score™ and Readiness Terminal are designed to do, and why your role matters.";
export const HUB_SCOPE =
  "An internal orientation hub for the people responsible for guiding, governing, advising, and protecting the work of PRSC and DIS.";

export const ROLE_CARDS: { tone: Tone; title: string; text: string; visual: "shield" | "ring" | "signal" }[] = [
  { tone: "prsc", title: "PRSC", text: "Standard and Governance", visual: "shield" },
  { tone: "bridge", title: "The PRSC Readiness Score™", text: "Shared Commercial-Readiness Language", visual: "ring" },
  { tone: "dis", title: "DIS + Readiness Terminal™", text: "Data, Platform, Intelligence, and Ongoing Utility", visual: "signal" },
];

export const PAGE_LABELS = [
  "What exists now",
  "What is being built",
  "What grows as the benchmark grows",
  "Future-state / not yet a market promise",
];

export const RELATIONSHIP = {
  columns: [
    {
      tone: "prsc" as Tone,
      title: "PRSC",
      rows: ["Defines and governs the PRSC Readiness Standard™", "Protects methodology, independence, and fairness", "Issues the official PRSC Readiness Score™"],
    },
    {
      tone: "bridge" as Tone,
      title: "Readiness Terminal™",
      rows: [
        "The market-facing product experience",
        "Delivers PRSC Readiness Score™ reports, benchmark context, and intelligence views",
        "Makes complex information understandable and usable",
      ],
    },
    {
      tone: "dis" as Tone,
      title: "DIS",
      rows: [
        "Builds and operates the intelligence platform",
        "Builds data pipelines, benchmarks, subscriber tools, and intelligence products",
        "Does not govern the PRSC Readiness Standard™ or issue the PRSC Readiness Score™",
      ],
    },
  ],
  lines: [
    "PRSC creates the methodology behind the PRSC Readiness Score™. DIS builds the technology that calculates the PRSC Readiness Score™ and makes data and benchmark intelligence useful.",
    "PRSC protects trust in the PRSC Readiness Score™. DIS makes the information useful.",
  ],
};

export const DIMENSIONS = [
  { name: "Signal Strength™", q: "Can the market clearly see that this program is ready to work with sponsors?" },
  { name: "Audience Value™", q: "Who does this program reach—and is that audience valuable to a sponsor?" },
  { name: "Platform Identity™", q: "Does the program have a clear, credible story about who it is and why it matters?" },
  { name: "Activation Capability™", q: "Can it deliver a good partnership experience after a sponsor comes on board?" },
  { name: "Measurement Confidence™", q: "Can it show what a sponsor received and whether the investment worked?" },
  { name: "Relationship Strength™", q: "Can it build and keep strong commercial relationships over time?" },
];

export type Audience = {
  name: string;
  problem: string;
  possible: string;
  receives: string[];
  notPromised: string;
  availability: string;
  future?: boolean;
};

export const AUDIENCES: Audience[] = [
  {
    name: "Teams and Drivers",
    problem: "They need money to keep racing, but often enter sponsor conversations without knowing what information a sponsor actually needs.",
    possible: "A plain-language understanding of their commercial position, so they can prepare for sponsorship conversations with more clarity.",
    receives: [
      "Private PRSC Readiness Score™",
      "Plain-language maturity explanation",
      "Commercial Strength Report™",
      "Peer-context benchmark information",
      "A view of what is working and what needs attention",
    ],
    notPromised: "No sponsor, deal, introduction, or funding is promised. DIS does not find sponsors or negotiate deals.",
    availability: "Available now through the Readiness Vanguard™; deeper history and context grow with data.",
  },
  {
    name: "Brands, Partners, and Investors",
    problem: "They need a measurable reason to invest, but motorsport rarely offers the audience, media, and performance information used in other channels.",
    possible: "A clearer way to assess whether a motorsport investment supports a defined business goal.",
    receives: [
      "Benchmark intelligence",
      "Audience reach and audience-quality context",
      "Media-value context",
      "Activation-performance information",
      "Category availability / white-space views",
    ],
    notPromised: "The Terminal supports a decision. It does not guarantee return, sales, performance, or a successful sponsorship, and it does not match brands with properties.",
    availability: "Grows as data sources and integrations come online.",
  },
  {
    name: "Partnership Ecosystem Operators™",
    problem: "Agencies, agents, and media buyers advise clients with instinct, disconnected reports, and sponsorship decks.",
    possible: "Advice grounded in shared readiness context and benchmark information across relevant client properties.",
    receives: [
      "Portfolio-level intelligence across relevant client properties",
      "Readiness context",
      "Audience, activation, and category-opportunity information",
      "Benchmark and market context",
    ],
    notPromised: "Portfolio intelligence is a DIS platform feature, not a PRSC-issued rating. The Terminal does not broker or facilitate deals.",
    availability: "Grows as the benchmark grows.",
  },
  {
    name: "Series",
    problem: "Series need stronger fields and more sponsor investment, without exposing an individual participant's PRSC Readiness Score™.",
    possible: "An aggregate view of the commercial strength of the field and where the ecosystem may need support.",
    receives: [
      "Anonymized series-level benchmark context",
      "Ecosystem readiness views",
      "Aggregate reporting",
      "Series-level audience and event intelligence as the platform matures",
    ],
    notPromised: "A series does not see an individual participant’s PRSC Readiness Score™ without explicit participant approval. No sponsor revenue is promised.",
    availability: "Early benchmark context now; deeper series intelligence grows with data.",
  },
  {
    name: "Manufacturers",
    problem: "They need a broader view for placing resources, engineering support, and program backing than competitive results alone.",
    possible: "Readiness, activation, and measurement context across relevant programs.",
    receives: [
      "Ecosystem readiness context",
      "Program-risk signals",
      "Activation and measurement-readiness views",
      "Benchmark intelligence across relevant programs",
    ],
    notPromised: "Manufacturers are a future-state Terminal audience. They are not Readiness Vanguard™ participants, and no program support is promised.",
    availability: "Future-state / not yet a market promise.",
    future: true,
  },
];

export const INTELLIGENCE = [
  { name: "Audience and consumer intelligence", q: "Who does this program reach? Who are the fans? Are they the right audience? Is the reach incremental or overlapping?" },
  { name: "Media and measurement intelligence", q: "What was seen? What was the media value? What did broadcast, digital, social, and content activity produce?" },
  { name: "Activation and event intelligence", q: "Did the activation work? What happened at the event? Did content, hospitality, fan engagement, or lead activity produce results?" },
  { name: "Commercial planning intelligence", q: "Which categories are available? Where is the white space? How can a sponsor evaluate spend, budget, and ROI?" },
  { name: "Portfolio and ecosystem intelligence", q: "How does an agency portfolio, series, or market compare? What is changing across the broader ecosystem?" },
  { name: "Priority intelligence", q: "What matters most next for this team, series, sponsor, or agency—without requiring them to sort through a large data file?" },
];

export const AVAILABILITY = [
  "Core / current build",
  "Available as data sources and integrations come online",
  "Future-state / planned intelligence",
  "Optional downstream capability",
];

export const IP_STACK = [
  { name: "The PRSC Readiness Standard™", text: "The official, independently governed definition of commercial readiness in motorsport." },
  { name: "The PRSC Readiness Score™", text: "The private PRSC Readiness Score™, written in plain commercial terms." },
  { name: "The Readiness Engine", text: "The proprietary scoring and calibration behind the PRSC Readiness Score™. The underlying math is a protected trade secret." },
  { name: "The Six Readiness Areas", text: "The six areas every participant is evaluated on, not a wins-and-followers PRSC Readiness Score™." },
  { name: "The Data Architecture", text: "Racing, audience, media, consumer, digital, and verified evidence, brought together in one system." },
  { name: "The Benchmark Database", text: "Anonymized comparisons that become more accurate as more participants are scored." },
  { name: "Outcome Intelligence", text: "Long-term data linking readiness to real commercial results: sponsor renewals, activations, and measurable value." },
  { name: "The Readiness Terminal™", text: "The DIS platform that puts the Standard and PRSC Readiness Score™ to work through reports, insights, and ongoing products." },
  { name: "The Trademark and Governance Framework", text: "Protected names, methodology, PRSC Readiness Score™, Standard, certification, and independence rules that establish trust." },
];

export const COMPETITIVE_TEXT =
  "Existing tools measure sponsorship exposure, manage rights and reporting, broker deals, or help properties tell their story. PRSC and DIS add something different: an independent readiness standard, a private PRSC Readiness Score™, clear rules for what counts as evidence, and a platform that shows how each program compares with its peers.";
export const COMPETITIVE_CONCLUSION =
  "We have not identified a clear direct competitor in motorsport combining all of these elements in one governed system.";

const CHAIN = "Verified evidence → calibrated readiness assessment → stronger benchmark context → more useful decision support → broader system learning.";

export const FLYWHEEL = [
  "Teams and drivers receive a private PRSC Readiness Score™ and report",
  "More scored programs create richer benchmark context",
  "Better benchmark context makes the Terminal more useful for sponsors, agencies, and series",
  "Demand-side users pay for deeper intelligence, planning, benchmark, and portfolio tools",
  "Series adoption expands the supply of scored programs and strengthens the Standard",
  "Over time, anonymized outcome information makes the system smarter, more credible, and more difficult to recreate",
];

const QUICK_REF = [
  "PRSC creates the independent standard for commercial readiness in motorsport. The PRSC Readiness Score™ makes that readiness simple to understand.",
  "DIS builds the Readiness Terminal™, which turns the PRSC Readiness Score™, benchmark context, and intelligence into useful views for teams and drivers, series, and sponsors.",
  "The strategic play is to give a fragmented industry a shared commercial language—then build the technology, data, and recurring intelligence products around that language.",
];

const SOURCE_GROUPS: TopicGroup[] = [
  {
    id: "a",
    letter: "A",
    title: "The Market and the Problem",
    topics: [
      {
        id: "big-picture",
        title: "The Big Picture",
        heading: "Motorsport needs a clearer way to understand commercial value.",
        tone: "bridge",
        blocks: [
          { kind: "list", title: "The simple problem", items: [
            "Teams and drivers need money to keep racing",
            "Series need attendance, strong programs, and sponsor revenue",
            "Sponsors need to understand what their money can do for their business",
            "Today, each group sees only part of the picture",
          ] },
          { kind: "quote", text: "PRSC creates a trusted way to measure commercial readiness. DIS builds the technology that makes that information useful." },
          { kind: "list", title: "What this is not", items: [
            "Not a sponsor marketplace",
            "Not a deal brokerage",
            "Not a matchmaking service",
            "Not an agency",
            "Not a promise of sponsorship, investment, audience growth, or financial return",
          ] },
        ],
      },
      {
        id: "ecosystem",
        title: "One Ecosystem, Different Questions",
        heading: "Everyone needs revenue. Nobody starts with the same information.",
        tone: "bridge",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Teams & Drivers", text: "Teams and drivers need money to race. Today they walk into a sponsorship conversation with race history, wins, followers, photos, logos, and a sponsor deck—without knowing if that is the information a sponsor needs. Missing: a plain-language method to understand their commercial value, why a sponsor conversation stalls, and what they need to improve." },
            { term: "Series", text: "Series need more people attending races, commercially stronger teams and drivers, and increased sponsor investment around the series. Missing: a clear method to understand commercial readiness across the ecosystem without exposing an individual participant's PRSC Readiness Score™." },
            { term: "Sponsors", text: "Brands, agencies, agents, media buyers, organizations, and other decision-makers need a measurable reason to invest money. Missing: the audience, media, consumer, activation, and performance metrics utilized in other major media and marketing channels." },
            { term: "Manufacturers", text: "Manufacturers need an informed method to decide where to place resources, engineering support, parts, brand equity, and program backing. Missing: a broader view of commercial readiness, activation capability, measurement confidence, and sponsorship sustainability—not simply competitive performance." },
          ] },
          { kind: "label", text: "Manufacturers are a future-state Readiness Terminal audience. They are not Readiness Vanguard™ participants." },
          { kind: "quote", text: "The ecosystem is not broken because people do not care or do not work hard. It is broken because people are making decisions without the same information—or a shared language for commercial value." },
        ],
      },
      {
        id: "market",
        title: "The Market Opportunity",
        heading: "Motorsport has commercial value. It lacks a shared measurement layer.",
        tone: "bridge",
        blocks: [
          { kind: "list", title: "Why now", items: [
            "Brands and agencies increasingly expect measurable audience, media, activation, and performance information",
            "Teams and drivers need more than a logo-placement pitch to compete for support",
            "Series need healthier, more commercially prepared fields",
            "Motorsport remains fragmented and comparatively data-poor",
          ] },
          { kind: "p", text: "There are tools that measure media exposure. There are platforms that manage sponsorship assets. There are agencies that sell or negotiate deals." },
          { kind: "quote", text: "There is not a clear independent system that helps the entire motorsport ecosystem understand commercial readiness before and beyond a sponsorship decision." },
          { kind: "p", text: "Motorsport is the beachhead: commercially meaningful, fragmented, under-measured, and rich with data opportunity. Market-size figures will be added here only once validated and sourced." },
          { kind: "quote", text: "DIS is not trying to create a sponsorship market. It is building the intelligence layer that can make an existing market easier to understand, evaluate, and use." },
        ],
      },
    ],
  },
  {
    id: "b",
    letter: "B",
    title: "PRSC, DIS and the PRSC Readiness Score™",
    topics: [
      {
        id: "prsc",
        links: ["governance", "charter"],
        title: "What PRSC Is",
        heading: "PRSC tells motorsport what “ready” means.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "The Partnership Readiness Standards Council is the independent council that defines commercial readiness in motorsport." },
          { kind: "quote", text: "FICO does not give someone a loan. It gives lenders a score they can understand. PRSC does not get someone a sponsor. It gives motorsport a PRSC Readiness Score™ that helps the ecosystem understand sponsorship readiness." },
          { kind: "list", title: "What PRSC does", items: [
            "Governs the PRSC Readiness Standard™",
            "Governs methodology, calibration, and PRSC Readiness Score™ rules",
            "Protects the PRSC Readiness Score™’s integrity and independence",
            "Issues the official PRSC Readiness Score™",
            "Oversees evidence and methodology review",
            "Governs Readiness Certified™ requirements",
          ] },
          { kind: "list", title: "What PRSC does not do", items: [
            "Sell sponsorship",
            "Take a percentage of a deal",
            "Recommend a sponsor",
            "Make introductions",
            "Favor a team, driver, sponsor, agency, manufacturer, or series",
            "Operate as a commercial agency",
          ] },
          { kind: "quote", text: "The PRSC Readiness Score™ must be trusted by the people being measured and by the people using it to make decisions." },
        ],
      },
      {
        id: "together",
        title: "How PRSC and DIS Work Together",
        heading: "Separate roles. One connected system.",
        tone: "bridge",
        blocks: [
          { kind: "relationship" },
          { kind: "list", title: "Why separation matters", items: [
            "An independent PRSC Readiness Score™ from a group with no financial stake in the outcome",
            "Trusted standard at the core, useful products around it",
            "PRSC and DIS support the same ecosystem but play different roles",
          ] },
        ],
      },
      {
        id: "score",
        links: ["score"],
        title: "The PRSC Readiness Score™",
        heading: "One private PRSC Readiness Score™. One clear starting point.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "Private. Scored 0–100. Shows where you stand commercially." },
          { kind: "list", title: "The Essentials", items: [
            "The PRSC Readiness Score™ is issued by PRSC and accessed through the Readiness Terminal™",
            "Compared like-for-like: same type of series, competitive level, and resources",
            "Each participant's PRSC Readiness Score™ is private by default",
            "The PRSC Readiness Score™ is not a certification",
          ] },
          { kind: "callout", title: "PRSC Readiness Score™ vs. Certification", text: "The PRSC Readiness Score™ is a diagnostic view of commercial readiness. Readiness Certified™ is a separate PRSC-governed credential that depends on verified evidence, eligibility requirements, and renewal standards." },
          { kind: "list", title: "What it does", items: [
            "Turns a complicated commercial picture into a clear starting point",
            "Shows which categories are commercially strong and which need attention",
            "Creates a common reference point for improved conversations",
            "Gives the participant clarity going into their next key commercial meeting",
          ] },
          { kind: "list", title: "What it is not", items: [
            "Not a public leaderboard",
            "Not a race ranking",
            "Not a popularity contest",
            "Not a measure of who has the most sponsors",
            "Not a scarlet letter",
            "Not a promise of a sponsor, deal, investment, or financial return",
          ] },

        ],
      },
      {
        id: "certification",
        links: ["score"],
        title: "PRSC Readiness Score™, Certification, and Privacy",
        heading: "What the PRSC Readiness Score™ is, what certification is, and who sees what.",
        tone: "prsc",
        blocks: [
          { kind: "callout", title: "PRSC Readiness Score™ vs. Certification", text: "The PRSC Readiness Score™ is a diagnostic view of commercial readiness. Readiness Certified™ is a separate PRSC-governed credential that depends on verified evidence, eligibility requirements, and renewal standards." },
          { kind: "list", title: "Privacy and fairness", items: [
            "Each individual PRSC Readiness Score™ is private by default",
            "Programs are compared against relevant peers",
            "A regional program is not measured against a factory-backed global program",
            "The PRSC Readiness Score™ does not change simply because another participant improves",
            "A participant controls whether their PRSC Readiness Score™ is shared",
          ] },
        ],
      },
      {
        id: "dimensions",
        links: ["score", "standards"],
        title: "What the PRSC Readiness Score™ Measures",
        heading: "Six simple questions—not just race results.",
        tone: "prsc",
        blocks: [
          { kind: "dimensions" },
          { kind: "quote", text: "The PRSC Readiness Score™ looks at the full commercial picture—not simply wins, budget, follower count, or logo space." },
        ],
      },
    ],
  },
  {
    id: "c",
    letter: "C",
    title: "The Readiness Terminal™ and Audience Value",
    topics: [
      {
        id: "dis",
        title: "DIS and the Readiness Terminal™",
        heading: "DIS makes the information useful.",
        tone: "dis",
        blocks: [
          { kind: "p", text: "Decision Intelligence Systems, Inc. is the corporate and platform company that builds the technology, data infrastructure, subscriber tools, benchmark operations, and intelligence products." },
          { kind: "list", title: "The Readiness Terminal™ is the market-facing platform built and operated by DIS. It is where users receive or access:", items: [
            "PRSC Readiness Score™ delivery and report experiences",
            "Benchmark context",
            "Audience-specific intelligence views",
            "Data-driven planning and measurement tools",
            "Longitudinal readiness and market insight",
          ] },
          { kind: "quote", text: "PRSC tells motorsport what “ready” means. DIS gives each audience a way to see it and use it." },
        ],
      },
      {
        id: "terminal-jobs",
        title: "What the Terminal Does",
        heading: "Five jobs. One connected system.",
        tone: "dis",
        blocks: [
          { kind: "callout", title: "Boundary", text: "The Readiness Terminal™ provides governed visibility, reports, benchmark context, and decision support. It does not broker deals, make introductions, guarantee sponsorship, or promise commercial outcomes." },
          { kind: "pairs", rows: [
            { term: "Rates readiness", text: "Delivers the PRSC Readiness Score™ and explains what it means." },
            { term: "Shows the full picture", text: "Brings together relevant racing, audience, media, consumer, digital, and commercial context." },
            { term: "Tracks change over time", text: "Shows whether readiness is improving, holding steady, or slipping—and where attention may be needed." },
            { term: "Provides each audience its own view", text: "The right information for the right decision, for each audience." },
            { term: "Builds the benchmark", text: "Every scored program and verified outcome makes the benchmark stronger and increasingly useful over time." },
          ] },
          { kind: "quote", text: "The PRSC Readiness Score™ starts the conversation. The Terminal creates ongoing value." },
        ],
      },
      {
        id: "audiences",
        title: "What Each Audience Receives",
        heading: "Concrete value by audience.",
        tone: "dis",
        blocks: [
          { kind: "p", text: "Member education about what PRSC and DIS make possible for each audience." },
          { kind: "audiences" },
        ],
      },
      {
        id: "intelligence",
        title: "The Intelligence Layer",
        heading: "What DIS is building beyond the PRSC Readiness Score™.",
        tone: "dis",
        blocks: [
          { kind: "intelligence" },
          { kind: "availability" },
          { kind: "label", text: "Not every capability is commercially available on day one." },
        ],
      },
    ],
  },
  {
    id: "d",
    letter: "D",
    title: "Data, Trust and Defensibility",
    topics: [
      {
        id: "data",
        title: "How the System Builds a More Complete Picture",
        heading: "Not a self-reported survey. Not a single data feed.",
        tone: "dis",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Racing and series information", text: "Official results context, event information, participation, timing, and series data where available." },
            { term: "Audience, media, and digital information", text: "Broadcast, content, social, web, earned-media, reach, engagement, and exposure signals." },
            { term: "Consumer and commercial information", text: "Audience behavior, category affinity, purchase intent, media consumption, and other information that helps sponsors understand business relevance." },
            { term: "Verified evidence", text: "When needed, credible records of activation, delivery, and commercial activity reviewed through defined evidence rules." },
          ] },
          { kind: "quote", text: "DIS builds the data pipelines. PRSC defines what the PRSC Readiness Score™ measures and governs how the PRSC Readiness Score™ is issued." },
          { kind: "p", text: "The system is designed to retrieve, ingest, and verify information wherever possible—not require participants to manually enter endless statistics or assess themselves." },
        ],
      },
      {
        id: "trust",
        links: ["governance", "standards"],
        title: "Why the PRSC Readiness Score™ Can Be Trusted",
        heading: "Governance, privacy, and independence are part of the product.",
        tone: "prsc",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Methodology governance", text: "PRSC governs how the PRSC Readiness Score™ is defined, calculated, calibrated, and reviewed." },
            { term: "Data and platform separation", text: "DIS builds the technology and data infrastructure but does not control the scoring rules." },
            { term: "Evidence rules", text: "Verified claims follow defined evidence requirements and review processes." },
            { term: "Privacy", text: "Each individual PRSC Readiness Score™ is private by default. Aggregated benchmark data may be used without exposing individual participants." },
          ] },
          { kind: "list", title: "Evidence integrity", items: [
            "Retrievable data should be Terminal-ingested where possible",
            "Participant-provided claims may require verification",
            "Claims that remain unresolved are routed for Methodology Committee review",
            "A PRSC Readiness Score™ cannot finalize while required verified claims remain unresolved",
            "Individual PRSC Readiness Score™ information and participant outputs are private by default",
          ] },
          { kind: "list", title: "No commercial conflict", items: [
            "PRSC does not sell sponsorship",
            "DIS does not broker introductions or take a percentage of a deal",
            "The system does not choose winners",
            "PRSC Readiness Score™ credibility is protected from commercial pressure",
          ] },
          { kind: "quote", text: "PRSC protects trust in the PRSC Readiness Score™. DIS makes the information useful." },
        ],
      },
      {
        id: "moat",
        title: "Why This Is Hard to Replicate",
        heading: "Why this is hard to replicate—and why DIS can become valuable.",
        tone: "bridge",
        blocks: [
          { kind: "ipstack" },
          { kind: "competitive" },
          { kind: "list", title: "What remains protected", items: [
            "Exact weights",
            "Scoring formulas",
            "Calibration mathematics",
            "Priority and recommendation logic",
            "Data mappings",
            "Internal benchmark methodology",
            "Participant-level and private information",
          ] },
          { kind: "quote", text: "A competitor can build a dashboard. What's much harder to replicate is everything behind it: a trusted, independent standard, protected scoring, verified data, years of peer comparisons and real-world results, and an ecosystem built around all of it." },
        ],
      },
    ],
  },
  {
    id: "e",
    letter: "E",
    title: "Validation and Scale",
    topics: [
      {
        id: "vanguard",
        links: ["vanguard-site"],
        title: "The Readiness Vanguard™",
        heading: "The first 25 teams and drivers.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "The Readiness Vanguard™ is the fixed, curated first group of 25 teams and drivers to receive the PRSC Readiness Score™ and Commercial Strength Report™ ahead of the 2027 racing season." },
          { kind: "list", title: "What participants receive", items: [
            "A private PRSC Readiness Score™ before the 2027 racing season",
            "A Commercial Strength Report™",
            "A plain-language explanation of their PRSC Readiness Score™",
            "A clear picture of what is working and what may need attention",
            "Benchmark insight from comparable programs, without exposing any other participant's individual PRSC Readiness Score™",
          ] },
          { kind: "list", title: "What it gives PRSC and DIS", items: [
            "Real-world evidence that the methodology works with actual racing programs",
            "The first data for the Benchmark Database",
            "A foundation for validating the connection between readiness, improvement, and commercial outcomes",
            "The starting point for the long-term Outcome Intelligence layer",
          ] },
          { kind: "list", title: "Locked principles", items: [
            "The Readiness Vanguard™ is a fixed, 25-slot, supply-side-first program",
            "It begins with teams and drivers",
            "Each individual PRSC Readiness Score™ is private by default",
            "Anonymized, aggregated benchmark data may be used as the system matures",
            "Brands and Partnership Ecosystem Operators™ are demand-side audiences",
            "Manufacturers are a future audience for the Readiness Terminal™, not Vanguard participants",
            "The Vanguard is not a promise of sponsorship, funding, brand interest, introductions, or commercial outcomes",
          ] },
          { kind: "list", title: "What participants should not expect", items: [
            "Sponsor matching",
            "A funding source",
            "A path to manufacturer relationships",
            "A public ranking",
          ] },
        ],
      },
      {
        id: "flywheel",
        links: ["vanguard"],
        title: "The Benchmark Flywheel",
        heading: "How the model builds value over time.",
        tone: "bridge",
        blocks: [
          { kind: "callout", title: "The story in one line", text: CHAIN },
          { kind: "flywheel" },
          { kind: "quote", text: "The PRSC Readiness Score™ starts the conversation. The Terminal creates ongoing value. The benchmark makes the system stronger." },
        ],
      },
      {
        id: "series",
        title: "The Series Adoption Path",
        heading: "How a PRSC Readiness Score™ becomes infrastructure.",
        tone: "prsc",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Tier 1 — Endorsement", text: "A series supports the Standard, encourages participation, and gains early benchmark context." },
            { term: "Tier 2 — Intelligence", text: "A series gains deeper series-level benchmark intelligence, aggregate reporting, and stronger sponsor-conversation tools." },
            { term: "Tier 3 — Mandate", text: "A series adopts the Standard as an expectation for a defined participant group or sponsor-eligibility use case." },
          ] },
          { kind: "callout", title: "The story in one line", text: CHAIN },
          { kind: "quote", text: "The long-term inflection point is not a single subscription. It is when a respected series adopts commercial readiness as part of how the sport operates." },
        ],
      },
    ],
  },
  {
    id: "f",
    letter: "F",
    title: "Governance and Your Role",
    topics: [
      {
        id: "why-governance",
        links: ["governance", "charter"],
        title: "Why Governance Matters",
        heading: "Trust, relevance, and responsible scale.",
        tone: "prsc",
        blocks: [
          { kind: "quote", text: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the PRSC Readiness Score™." },
        ],
      },
      {
        id: "board",
        title: "The Board",
        heading: "The Board’s role.",
        tone: "prsc",
        blocks: [
          { kind: "list", title: "The Board helps ensure the organization is:", items: [
            "Governed responsibly",
            "Financially disciplined",
            "Commercially practical",
            "Positioned to scale without compromising trust",
            "Building the right team, partnerships, and institutional foundation",
          ] },
        ],
      },
      {
        id: "advisors",
        title: "Advisors",
        heading: "The Advisors’ role.",
        tone: "prsc",
        blocks: [
          { kind: "list", title: "Advisors help keep the work connected to the real market:", items: [
            "Teams and drivers",
            "Series and sanctioning bodies",
            "Sponsor-side buyers",
            "Agencies and media buyers",
            "Manufacturers",
            "Media, data, technology, and measurement leaders",
          ] },
          { kind: "p", text: "They provide reality checks, sector expertise, strategic perspective, and—in appropriate situations—high-value introductions." },
        ],
      },
      {
        id: "committee",
        links: ["standards", "governance"],
        title: "The Methodology Committee",
        heading: "The Methodology Committee protects the integrity of the PRSC Readiness Standard™ and the PRSC Readiness Score™.",
        tone: "prsc",
        blocks: [
          { kind: "list", title: "The Committee:", items: [
            "Reviews methodology and calibration updates",
            "Governs evidence and verification rules",
            "Reviews unusual, unresolved, or anomalous scoring matters",
            "Helps ensure fairness across comparable peer groups",
            "Keeps the PRSC Readiness Score™ separate from commercial pressure",
          ] },
          { kind: "quote", text: "The Methodology Committee is what keeps the PRSC Readiness Score™ from becoming a sales tool." },
          { kind: "p", text: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the PRSC Readiness Score™." },
        ],
      },
      {
        id: "quick-reference",
        title: "Quick Reference",
        heading: "The one-minute refresher.",
        tone: "bridge",
        blocks: [
          ...QUICK_REF.map((text) => ({ kind: "quote" as const, text })),
          { kind: "label", text: "Drive Fast. Decide Faster." },
        ],
      },
      {
        id: "resources",
        title: "Resource Library",
        heading: "For board and advisor reference.",
        tone: "bridge",
        blocks: [
          { kind: "p", text: "Reference materials will be added here as they are finalized." },
          { kind: "soon", items: [
            "PRSC Governance Structure",
            "PRSC Readiness Score™ Overview",
            "Methodology and PRSC Readiness Score™ FAQ",
            "DIS / Readiness Terminal™ Product Overview",
            "The Intelligence Layer and Module Map",
            "Readiness Vanguard™ Overview",
            "Series Partnership Framework",
            "Current Milestones and Build Status",
            "Board, Advisor, and Methodology Committee Directory",
            "Decisions, Meeting Materials, and Updates",
          ] },
          { kind: "p", text: "Materials released to you now appear in Your Documents." },
        ],
      },
    ],
  },
];

const src = (id: string) => SOURCE_GROUPS.flatMap((g) => g.topics).find((x) => x.id === id)!;

const GOVERNANCE_PROTECTS: Topic = {
  id: "governance-protects",
  links: ["governance", "charter", "standards"],
  title: "How Governance Protects the System",
  heading: "Trust, relevance, and responsible scale.",
  tone: "prsc",
  blocks: [
    { kind: "p", text: "PRSC governs the Standard, the methodology, and how the PRSC Readiness Score™ is issued. DIS builds the technology but does not control the scoring rules." },
    { kind: "quote", text: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the PRSC Readiness Score™." },
    { kind: "p", text: "Your own role responsibilities are in Role Details." },
  ],
};

export const GROUPS: TopicGroup[] = [
  { id: "a", letter: "A", title: "The Market and the System", topics: ["big-picture", "ecosystem", "market", "prsc", "together"].map(src) },
  { id: "b", letter: "B", title: "The PRSC Readiness Score™ and the Terminal", topics: ["score", "dimensions", "certification", "dis", "terminal-jobs", "audiences", "intelligence"].map(src) },
  { id: "c", letter: "C", title: "Trust, IP, and Governance", topics: [...["data", "trust", "moat"].map(src), GOVERNANCE_PROTECTS] },
  { id: "d", letter: "D", title: "Validation and Scale", topics: ["vanguard", "flywheel", "series"].map(src) },
];

export const RESOURCE_LIBRARY = (src("resources").blocks.find((b) => b.kind === "soon") as { items: string[] }).items;
export const QUICK_REFERENCE = QUICK_REF;

// Guided orientation: six chapters drawn from the topics above.
export const GUIDED: { title: string; topic: Topic }[] = [
  { title: "The Problem", topic: src("ecosystem") },
  { title: "The System", topic: src("together") },
  { title: "The PRSC Readiness Score™", topic: src("score") },
  { title: "What the Readiness Terminal Delivers", topic: src("terminal-jobs") },
  { title: "Why This Is Hard to Replicate", topic: src("moat") },
  { title: "The Readiness Vanguard™", topic: src("vanguard") },
];

export const ALL_TOPICS = GROUPS.flatMap((g) => g.topics);

// Personalized Role Details: shown only for the roles a member holds.
export const ROLE_DETAILS: Record<"board" | "advisor" | "committee", { title: string; lede: string; items: string[] }> = {
  board: {
    title: "Your Role on the Board",
    lede: "The Board helps the organizations grow responsibly.",
    items: [
      "Provide oversight and strategic governance",
      "Help ensure the organization is governed responsibly, financially disciplined, and commercially practical",
      "Protect independence, credibility, and responsible scale, so growth never compromises trust",
      "Help build the right team, partnerships, and institutional foundation",
      "Attend Official Board Meetings, review materials in advance, and take part in decisions",
      "Read, acknowledge, or sign the documents released to you in Your Personal Documents",
    ],
  },
  advisor: {
    title: "Your Role as an Advisor",
    lede: "Advisors keep the work connected to the market.",
    items: [
      "Offer strategic counsel, market context, and sector perspective",
      "Share relationship insight from teams and drivers, series, sponsor-side buyers, agencies, media, and technology",
      "Provide reality checks on what the market needs",
      "Advisors do not govern methodology or issue PRSC Readiness Score™ results",
      "Join Advisory Meetings when invited and share your availability when dates are proposed",
      "Read, acknowledge, or sign the documents released to you in Your Personal Documents",
    ],
  },
  committee: {
    title: "Your Role on the Methodology Committee",
    lede: "The Methodology Committee protects the integrity of the PRSC Readiness Standard™ and the PRSC Readiness Score™.",
    items: [
      "Review methodology and calibration updates",
      "Govern evidence and verification rules",
      "Review unusual or unresolved verified claims where applicable, along with anomalous scoring matters",
      "Help ensure fairness across comparable peer groups",
      "Help keep the PRSC Readiness Score™ separate from commercial pressure",
      "Attend Methodology Committee Meetings and review materials released to you",
    ],
  },
};
