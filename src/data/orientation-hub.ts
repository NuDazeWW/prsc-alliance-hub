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
  | { kind: "flywheel" }
  | { kind: "pairs"; rows: { term: string; text: string }[] };

export type Topic = { id: string; title: string; heading: string; tone: Tone; blocks: Block[]; links?: string[] };

export const SITE_LINKS = [
  { id: "score", label: "PRSC Readiness Score™ — The Standard", href: "/the-standard" },
  { id: "governance", label: "Governance", href: "/governance" },
  { id: "charter", label: "Governance Charter", href: "/governance/charter" },
  { id: "standards", label: "Written Standards", href: "/governance/written-standards" },
  { id: "vanguard", label: "The Readiness Vanguard™", href: "/readiness-vanguard" },
];
export type TopicGroup = { id: string; letter: string; title: string; topics: Topic[] };

export const HUB_TITLE = "Welcome to the PRSC & DIS Orientation Hub";
export const HUB_INTRO =
  "This hub is a shared reference point for the people helping guide PRSC and DIS. It explains the problem we are solving, how the organizations work together, what the Score and Terminal are designed to do, and why your role matters.";
export const HUB_SCOPE =
  "An internal orientation hub for the people responsible for guiding, governing, advising, and protecting the work of PRSC and DIS.";

export const ROLE_CARDS: { tone: Tone; title: string; text: string; visual: "shield" | "ring" | "signal" }[] = [
  { tone: "prsc", title: "PRSC", text: "Standard and governance", visual: "shield" },
  { tone: "bridge", title: "PRSC Readiness Score™", text: "Shared commercial-readiness language", visual: "ring" },
  { tone: "dis", title: "DIS + Readiness Terminal™", text: "Data, platform, intelligence, and ongoing utility", visual: "signal" },
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
      rows: ["Defines and governs the Standard", "Governs methodology, fairness, and independence", "Issues the official PRSC Readiness Score™"],
    },
    {
      tone: "bridge" as Tone,
      title: "Readiness Terminal™",
      rows: [
        "The market-facing product experience",
        "Delivers Score reports, benchmark context, and intelligence views",
        "Makes complex information understandable and usable",
      ],
    },
    {
      tone: "dis" as Tone,
      title: "DIS",
      rows: [
        "Builds and operates the platform",
        "Builds data pipelines, benchmarks, subscriber tools, and intelligence products",
        "Does not govern the Standard or issue the Score",
      ],
    },
  ],
  lines: [
    "PRSC sets the rules and issues the Score. DIS builds the technology that makes the Score, data, and benchmark intelligence useful.",
    "PRSC protects trust in the Score. DIS makes the information useful.",
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

export const AUDIENCES = [
  {
    name: "Teams & Drivers",
    receives: [
      "Private PRSC Readiness Score™",
      "Plain-language maturity explanation",
      "Commercial Strength Report™",
      "Peer-context benchmark information",
      "A view of what is working and what needs attention",
      "Over time: score movement, audience/media context, activation and content views, report history, and readiness priorities",
    ],
    helps: "Understand their commercial position and prepare for sponsorship conversations with more clarity.",
    boundary: "DIS does not find them a sponsor, negotiate a deal, make an introduction, or promise funding.",
  },
  {
    name: "Series",
    receives: [
      "Anonymized series-level benchmark context",
      "Ecosystem readiness views",
      "Aggregate reporting",
      "Series-level audience and event intelligence as the platform matures",
      "Tools to support sponsor, fan-growth, and series-business conversations",
    ],
    helps: "Understand the commercial strength of the field and where the ecosystem may need support.",
    boundary: "A series does not see an individual participant’s Score without explicit participant approval.",
  },
  {
    name: "Sponsors",
    receives: [
      "Benchmark intelligence",
      "Audience reach and audience-quality context",
      "Media-value context",
      "Activation-performance information",
      "Category availability / white-space views",
      "Where available and appropriate: ROI and budget-planning tools",
    ],
    helps:
      "Assess whether a motorsport investment supports a defined business goal—such as visibility, relevant reach, engagement, lead generation, or measurable return.",
    boundary: "The Terminal supports a decision. It does not guarantee return, sales, performance, or a successful sponsorship.",
  },
  {
    name: "Agencies & Agents",
    receives: [
      "Portfolio-level intelligence across relevant client properties",
      "Readiness context",
      "Audience, activation, and category-opportunity information",
      "Benchmark and market context",
      "Agency intelligence tools that identify strengths, gaps, and portfolio opportunities",
    ],
    helps: "Advise clients using more than instinct, disconnected reports, and PowerPoint decks.",
    boundary: "Agency intelligence is a DIS platform feature. It is not a PRSC-issued agency rating.",
  },
  {
    name: "Manufacturers",
    receives: [
      "Ecosystem readiness context",
      "Program-risk signals",
      "Activation and measurement-readiness views",
      "Benchmark intelligence across relevant programs",
    ],
    helps: "Make more informed decisions about engineering resources, parts, brand equity, and program support.",
    boundary: "Manufacturers are a future-state Terminal audience. They are not included in the Readiness Vanguard™.",
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
  { name: "The PRSC Readiness Standard™", text: "The governed definition of commercial readiness in motorsport." },
  { name: "The PRSC Readiness Score™", text: "The private, market-facing score that makes readiness understandable." },
  { name: "The Readiness Engine™", text: "Protected scoring, calibration, and prioritization logic. The underlying math is a trade secret." },
  { name: "The six dimensions", text: "The full commercial-readiness framework—not a wins-and-followers score." },
  { name: "The data architecture", text: "Racing, audience, media, consumer, digital, series, and verified-evidence inputs brought into one system." },
  { name: "The Benchmark Database", text: "Anonymized benchmark context that strengthens as more programs are scored." },
  { name: "Outcome Intelligence", text: "A long-term dataset connecting readiness signals to commercial outcomes, renewal, activation, and measurable value." },
  { name: "The Readiness Terminal™", text: "The DIS platform that operationalizes the Standard and Score through useful views, reports, intelligence, and recurring products." },
  { name: "The trademark and governance spine", text: "Protected names, methodology, score, Standard, certification, and independence rules that establish trust." },
];

export const FLYWHEEL = [
  "Teams and drivers receive a private Score and report.",
  "More scored programs create richer benchmark context.",
  "Better benchmark context makes the Terminal more useful for sponsors, agencies, and series.",
  "Demand-side users pay for deeper intelligence, planning, benchmark, and portfolio tools.",
  "Series adoption expands the supply of scored programs and strengthens the Standard.",
  "Over time, anonymized outcome information makes the system smarter, more credible, and more difficult to recreate.",
];

const QUICK_REF = [
  "PRSC creates the independent standard for commercial readiness in motorsport. The PRSC Readiness Score™ makes that readiness simple to understand.",
  "DIS builds the Readiness Terminal™, which turns the Score, benchmark context, and intelligence into useful views for teams and drivers, series, and sponsors.",
  "The strategic play is to give a fragmented industry a shared commercial language—then build the technology, data, and recurring intelligence products around that language.",
];

export const GROUPS: TopicGroup[] = [
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
            "Teams and drivers need money to keep racing.",
            "Series need attendance, strong programs, and sponsor revenue.",
            "Sponsors need to understand what their money can do for their business.",
            "Today, each group sees only part of the picture.",
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
            { term: "Teams & drivers", text: "Need money to keep racing. Today they may walk into a sponsorship conversation with race history, wins, followers, photos, logos, and a sponsor deck—without knowing whether that is the information a sponsor needs. Missing: a plain-language way to understand their commercial value, why a sponsor conversation may stall, and what they may need to strengthen." },
            { term: "Series", text: "Need more people at races, stronger teams and drivers, and more sponsor investment around the series. Missing: a better way to understand commercial readiness across the ecosystem without exposing individual participant scores." },
            { term: "Sponsors", text: "Brands, agencies, agents, media buyers, organizations, and other decision-makers need a measurable reason to spend money. Missing: the kinds of audience, media, consumer, activation, and performance information used in other major media and marketing channels." },
            { term: "Manufacturers", text: "Need a better way to decide where to place resources, engineering support, parts, brand equity, and program backing. Missing: a broader view of commercial readiness, activation capability, measurement confidence, and sponsorship sustainability—not simply competitive performance." },
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
            "Brands and agencies increasingly expect measurable audience, media, activation, and performance information.",
            "Teams and drivers need more than a logo-placement pitch to compete for support.",
            "Series need healthier, more commercially prepared fields.",
            "Motorsport remains fragmented and comparatively data-poor.",
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
    title: "PRSC, DIS and the Score",
    topics: [
      {
        id: "prsc",
        links: ["governance", "charter"],
        title: "What PRSC Is",
        heading: "PRSC tells motorsport what “ready” means.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "The Partnership Readiness Standards Council is the independent council that defines commercial readiness in motorsport." },
          { kind: "quote", text: "FICO does not give someone a loan. It gives lenders a score they can understand. PRSC does not get someone a sponsor. It gives motorsport a score that helps the ecosystem understand sponsorship readiness." },
          { kind: "list", title: "What PRSC does", items: [
            "Governs the PRSC Readiness Standard™",
            "Governs methodology, calibration, and score rules",
            "Protects the Score’s integrity and independence",
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
          { kind: "quote", text: "The Score must be trusted by the people being measured and by the people using it to make decisions." },
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
            "A score is more credible when the group issuing it does not sell deals or take a percentage of commercial outcomes.",
            "A platform is more valuable when it can build useful products around a trusted, independently governed standard.",
            "PRSC and DIS support the same ecosystem, but they do not perform the same job.",
          ] },
        ],
      },
      {
        id: "score",
        links: ["score"],
        title: "What the Score Is—and Is Not",
        heading: "One private score. One clearer starting point.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "A private 0–100 score that helps a participating entity understand commercial readiness." },
          { kind: "list", title: "What it does", items: [
            "Turns a complicated commercial picture into a clear starting point",
            "Shows what is strong",
            "Shows what may need attention",
            "Creates a common reference point for better conversations",
            "Gives the participant a clearer understanding before the next important commercial meeting",
          ] },
          { kind: "list", title: "What it is not", items: [
            "Not a public leaderboard",
            "Not a race ranking",
            "Not a popularity contest",
            "Not a measure of who has the largest budget",
            "Not a scarlet letter",
            "Not a promise of a sponsor, deal, investment, or financial return",
          ] },
          { kind: "list", title: "Privacy and fairness", items: [
            "Individual scores are private by default",
            "Programs are compared against relevant peers",
            "A regional program is not measured against a factory-backed global program",
            "The Score does not change simply because another participant improves",
            "A participant controls whether their score is shared",
          ] },
        ],
      },
      {
        id: "dimensions",
        links: ["score", "standards"],
        title: "What the Score Looks At",
        heading: "Six simple questions—not just race results.",
        tone: "prsc",
        blocks: [
          { kind: "dimensions" },
          { kind: "quote", text: "The Score looks at the full commercial picture—not simply wins, budget, follower count, or logo space." },
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
            "Score delivery and report experiences",
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
          { kind: "pairs", rows: [
            { term: "Rates readiness", text: "Delivers the PRSC Readiness Score™ and explains what it means." },
            { term: "Shows the full picture", text: "Brings together relevant racing, audience, media, consumer, digital, and commercial context." },
            { term: "Tracks change over time", text: "Shows whether readiness is improving, holding steady, or slipping—and where attention may be needed." },
            { term: "Gives each audience its own view", text: "Each audience sees the information relevant to the decision it is trying to make." },
            { term: "Builds the benchmark", text: "Every scored program and verified outcome can make the benchmark stronger and more useful over time." },
          ] },
          { kind: "quote", text: "The Score starts the conversation. The Terminal creates ongoing value." },
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
        heading: "What DIS is building beyond the Score.",
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
          { kind: "quote", text: "DIS builds the data pipelines. PRSC defines what the Score measures and governs how the Score is issued." },
          { kind: "p", text: "The system is designed to retrieve, ingest, and verify information wherever possible—not require participants to manually enter endless statistics or self-score." },
        ],
      },
      {
        id: "trust",
        links: ["governance", "standards"],
        title: "Why the Score Can Be Trusted",
        heading: "Governance, privacy, and independence are part of the product.",
        tone: "prsc",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Methodology governance", text: "PRSC governs the Score’s definitions, methodology, calibration rules, and review process." },
            { term: "Data and platform separation", text: "DIS builds the technology and data infrastructure but does not control the scoring rules." },
            { term: "Evidence rules", text: "Verified claims follow defined evidence requirements and review processes." },
            { term: "Confidentiality", text: "Individual Scores are private by default. Aggregated benchmark data may be used without exposing individual participants." },
          ] },
          { kind: "list", title: "No commercial conflict", items: [
            "PRSC does not sell sponsorship",
            "DIS does not broker introductions or take a percentage of a deal",
            "The system does not choose winners",
            "Score credibility is protected from commercial pressure",
          ] },
          { kind: "quote", text: "PRSC protects trust in the Score. DIS makes the information useful." },
        ],
      },
      {
        id: "moat",
        title: "Why This Is Hard to Copy",
        heading: "Why this is hard to copy—and why DIS can become valuable.",
        tone: "bridge",
        blocks: [
          { kind: "ipstack" },
          { kind: "list", title: "What remains protected", items: [
            "Exact weights",
            "Scoring formulas",
            "Calibration mathematics",
            "Priority and recommendation logic",
            "Data mappings",
            "Internal benchmark methodology",
            "Participant-level and confidential information",
          ] },
          { kind: "quote", text: "A competitor can build a dashboard. It is much harder to build a trusted, independent standard; protected scoring logic; verified data infrastructure; benchmark context; outcome evidence; and an ecosystem that uses all of it over time." },
          { kind: "quote", text: "There are companies that measure sponsorship and companies that manage sponsorship. There is no clear direct competitor combining an independent motorsport readiness standard, a privately issued Score, governed evidence rules, and a multi-audience intelligence platform." },
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
        links: ["vanguard"],
        title: "The Readiness Vanguard™",
        heading: "The first 25 teams and drivers.",
        tone: "prsc",
        blocks: [
          { kind: "p", text: "The Readiness Vanguard™ is the fixed, curated first group of 25 teams and drivers to receive the PRSC Readiness Score™ and Commercial Strength Report™." },
          { kind: "list", title: "What participants receive", items: [
            "A private Score before the 2027 racing season",
            "A Commercial Strength Report™",
            "Plain-language Score interpretation",
            "A clear picture of what is working and what may need attention",
            "Comparable peer-context benchmark insight without exposing another participant’s individual Score",
          ] },
          { kind: "list", title: "What it gives PRSC and DIS", items: [
            "Real-world evidence that the methodology works with actual racing programs",
            "The first benchmark dataset",
            "A foundation for validating the connection between readiness, improvement, and commercial outcomes",
            "The beginning of the Benchmark Database and long-term Outcome Intelligence layer",
          ] },
          { kind: "list", title: "What it is not", items: [
            "Not a sponsor-matching program",
            "Not free money",
            "Not a manufacturer hookup",
            "Not a public ranking",
            "Not a guarantee of sponsorship, funding, a deal, or an introduction",
          ] },
        ],
      },
      {
        id: "flywheel",
        title: "The Benchmark Flywheel",
        heading: "How the model builds value over time.",
        tone: "bridge",
        blocks: [
          { kind: "flywheel" },
          { kind: "quote", text: "The Score starts the conversation. The Terminal creates ongoing value. The benchmark makes the system stronger." },
        ],
      },
      {
        id: "series",
        title: "The Series Adoption Path",
        heading: "How a score becomes infrastructure.",
        tone: "prsc",
        blocks: [
          { kind: "pairs", rows: [
            { term: "Tier 1 — Endorsement", text: "A series supports the Standard, encourages participation, and gains early benchmark context." },
            { term: "Tier 2 — Intelligence", text: "A series gains deeper series-level benchmark intelligence, aggregate reporting, and stronger sponsor-conversation tools." },
            { term: "Tier 3 — Mandate", text: "A series adopts the Standard as an expectation for a defined participant group or sponsor-eligibility use case." },
          ] },
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
          { kind: "quote", text: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the Score." },
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
            "Keeps the Score separate from commercial pressure",
          ] },
          { kind: "quote", text: "The Methodology Committee is what keeps the Score from becoming a sales tool." },
          { kind: "p", text: "The Board helps the organizations grow responsibly. Advisors keep the work connected to the market. The Methodology Committee protects the integrity of the Score." },
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
            "Methodology and Score FAQ",
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

const t = (id: string) => GROUPS.flatMap((g) => g.topics).find((x) => x.id === id)!;

// Guided 5-minute orientation: seven chapters drawn from the topics above.
export const GUIDED: { title: string; topic: Topic }[] = [
  { title: "The Problem", topic: t("ecosystem") },
  { title: "The System", topic: t("together") },
  { title: "The Score", topic: t("score") },
  { title: "What the Terminal Delivers", topic: t("terminal-jobs") },
  { title: "Why It Is Different", topic: t("moat") },
  { title: "The Readiness Vanguard™", topic: t("vanguard") },
  { title: "Why Your Role Matters", topic: t("committee") },
];

export const ALL_TOPICS = GROUPS.flatMap((g) => g.topics);
