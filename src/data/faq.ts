export type FaqItem = {
  id: number;
  category: string;
  question: string;
  answer: string;
};

export const FAQ_CATEGORIES = [
  "About the Score",
  "Understanding Your Score",
  "Sponsorship & Commercial Value",
  "The Readiness Vanguard™",
  "Your Data & Privacy",
  "Independence & Governance",
  "Why Trust PRSC?",
  "Cost",
  "Getting Started",
] as const;

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 1,
    category: "About the Score",
    question: "What exactly determines my score?",
    answer:
      "Your PRSC Readiness Score™ measures your commercial readiness across six dimensions: Signal Strength™, Audience Value™, Platform Identity™, Activation Capability™, Measurement Confidence™, and Relationship Strength™. It combines independently sourced information with evidence you provide to create a 0–100 picture of where you stand today.",
  },
  {
    id: 2,
    category: "About the Score",
    question: "How much does each of the six dimensions count?",
    answer:
      "PRSC does not publish the weights used in the scoring model. The dimensions are public; the weighting, formulas, calibration methods, and other scoring mechanics are protected intellectual property. This helps preserve the integrity of the Score and makes it harder to game.",
  },
  {
    id: 3,
    category: "About the Score",
    question: "Is one category weighted more heavily than another?",
    answer:
      "The dimensions work together to measure commercial readiness. PRSC does not disclose individual or relative weights. What matters for participants is understanding what is measured, what evidence supports it, and where you can improve.",
  },
  {
    id: 4,
    category: "About the Score",
    question: "What data do you need from me to calculate my score?",
    answer:
      "Some information can be gathered independently, such as official racing results and publicly available audience or platform information. You'll also provide evidence that only you can provide, such as partnership history, activation examples, measurement information, and other proof of how you operate commercially.",
  },
  {
    id: 5,
    category: "About the Score",
    question: "How much comes from data you collect versus information I submit?",
    answer:
      "Both are important. PRSC uses independently available information where reliable sources exist and asks you for evidence where you are the best or only source. The exact mix depends on the participant and the information being measured.",
  },
  {
    id: 6,
    category: "About the Score",
    question: "How do you verify what a team or driver tells you?",
    answer:
      "The Score is evidence-based, not a self-rating. Information may be checked against independent sources, and submitted evidence may require documentation or clarification. PRSC's methodology and governance processes are designed to support consistent treatment across participants.",
  },
  {
    id: 7,
    category: "About the Score",
    question: "How do you stop someone from gaming the Score?",
    answer:
      "Participants don't choose their own scores, and the scoring formula isn't public. PRSC combines independent data, documented evidence, verification controls, and a protected methodology. Keeping the scoring mechanics confidential is an important part of protecting the integrity of the Standard.",
  },
  {
    id: 8,
    category: "About the Score",
    question: "Is the methodology the same for a driver and a team?",
    answer:
      "Everyone is measured under the same PRSC Readiness Standard™, but context matters. The Score is calibrated so that participants are evaluated against appropriate comparable benchmarks rather than pretending every driver and team operates in the same environment.",
  },
  {
    id: 9,
    category: "About the Score",
    question:
      "How do you compare a Trans Am driver with an IMSA team—or someone racing at a completely different level?",
    answer:
      "You are not compared against everyone. You are compared against people like you. The Score is calibrated using comparable participants based on competitive context, including factors such as series, level of competition, and resource profile. A regional program is not expected to look like a factory-backed effort.",
  },
  {
    id: 10,
    category: "About the Score",
    question: "Does racing performance affect the Score?",
    answer:
      "Racing performance matters, but the PRSC Readiness Score™ is not a racing-performance ranking. Commercial readiness also includes your audience, identity, ability to deliver partnerships, ability to prove results, and strength of commercial relationships. Winning helps. It isn't the whole answer.",
  },
  {
    id: 11,
    category: "About the Score",
    question: "Does having more money automatically give someone a higher score?",
    answer:
      "No. Bigger budgets can create more resources, but PRSC is measuring what you do with what you have and what you can prove. A well-run smaller program can demonstrate stronger commercial readiness than a larger program that does not execute effectively.",
  },
  {
    id: 12,
    category: "About the Score",
    question: "What if I don't have much audience data yet?",
    answer:
      "That's okay. The Score measures where you are today. If important audience information isn't available or can't yet be demonstrated, that may identify an area to build. Knowing what you cannot currently prove is part of becoming more ready.",
  },
  {
    id: 13,
    category: "About the Score",
    question: "What if I'm commercially strong but don't have a huge social following?",
    answer:
      "Followers are not the Score. Social reach can be useful evidence, but commercial readiness is much broader. PRSC looks across all six dimensions, including how well you understand your audience, deliver partnerships, measure results, and build commercial relationships.",
  },
  {
    id: 14,
    category: "About the Score",
    question: "How often does my score change?",
    answer:
      "Your Score represents your commercial readiness based on the information available at the time it is calculated. As your evidence and capabilities change, a future score can reflect that progress.",
  },
  {
    id: 15,
    category: "About the Score",
    question: "Can my score go down?",
    answer:
      "Yes. Commercial readiness can improve or decline over time. A score is intended to reflect your current position—not permanently preserve a number that no longer reflects the evidence.",
  },
  {
    id: 16,
    category: "About the Score",
    question: "Can I challenge my score if I think it's wrong?",
    answer:
      "PRSC does not manually change a score simply because someone disagrees with it. If your score appears wrong, an error in the underlying information may be the cause. That information must be corrected with the source or scoring entity responsible for it. Once the corrected information is available to the scoring process, your Score can reflect the updated data.",
  },
  {
    id: 17,
    category: "About the Score",
    question: "Who actually certifies the number?",
    answer:
      "The PRSC Readiness Score™ is issued under the PRSC Readiness Standard™ and governed by PRSC. The Methodology Committee protects the integrity of the methodology, including its measurement, audience, activation, relationship, mathematical, and calibration principles.",
  },
  {
    id: 18,
    category: "Understanding Your Score",
    question: "What is a good score?",
    answer:
      "There isn't one magic number that guarantees commercial success. The PRSC Readiness Maturity Index™ gives your number context: 0–20 Commercially Invisible, 21–40 Commercially Possible, 41–60 Commercially Credible, 61–80 Commercially Investable, and 81–100 Commercially Undeniable.",
  },
  {
    id: 19,
    category: "Understanding Your Score",
    question: "What score do I need before a brand will take me seriously?",
    answer:
      "There is no universal cutoff. Different brands have different audiences, objectives, budgets, and requirements. The Score gives them a consistent way to understand your readiness; it does not make their investment decision for them.",
  },
  {
    id: 20,
    category: "Understanding Your Score",
    question: "If I get a 55, is that bad?",
    answer:
      "No. A 55 falls within Commercially Credible. It means you have demonstrated meaningful commercial capability while still having areas that can become stronger. The most useful part isn't simply the 55—it's understanding what is behind it.",
  },
  {
    id: 21,
    category: "Understanding Your Score",
    question: "What happens if I get a low score?",
    answer:
      "You learn where you stand. A low score isn't published automatically and isn't a punishment. It gives you a starting point for understanding where your commercial readiness is strong and where important gaps remain.",
  },
  {
    id: 22,
    category: "Understanding Your Score",
    question: "Will anyone besides me know I got a low score?",
    answer:
      "Your Score is private by default. You control whether you share it and with whom. PRSC does not automatically publish an individual's Score simply because they have been assessed.",
  },
  {
    id: 23,
    category: "Understanding Your Score",
    question: "Can I improve and be rescored?",
    answer:
      "Yes. The Score is intended to measure progress, not permanently label you. As you strengthen your capabilities and the evidence supporting them, you can be scored again.",
  },
  {
    id: 24,
    category: "Understanding Your Score",
    question: "How long would it realistically take me to move from a 50 to a 70?",
    answer:
      "It depends on what is keeping you at 50. Some gaps may be addressed relatively quickly. Others—such as building audience knowledge, measurement history, partnership experience, or stronger commercial processes—take time. There is no responsible universal timetable.",
  },
  {
    id: 25,
    category: "Sponsorship & Commercial Value",
    question: "Will brands actually recognize this Score?",
    answer:
      "Recognition has to be earned. PRSC is building the benchmark, governance, evidence, and industry participation needed for the Score to become a trusted reference point. We aren't asking the market to believe in it simply because we created it.",
  },
  {
    id: 26,
    category: "Sponsorship & Commercial Value",
    question: "Which brands have agreed to use it?",
    answer:
      "PRSC will identify formal participants, partners, or adopters only when those relationships are confirmed and authorized for public disclosure. We will not imply an endorsement that does not exist.",
  },
  {
    id: 27,
    category: "Sponsorship & Commercial Value",
    question: "Which agencies will look at it?",
    answer:
      "PRSC is engaging people across brands, agencies, media, measurement, and motorsport as the Standard develops. Specific organizations will only be identified publicly when appropriate and authorized.",
  },
  {
    id: 28,
    category: "Sponsorship & Commercial Value",
    question: "If I have an 85 and another driver has a 60, does that mean I get the sponsorship?",
    answer:
      "No. The Score measures readiness; it does not decide who gets a deal. A brand will still consider audience fit, objectives, geography, budget, timing, personality, category needs, and many other factors.",
  },
  {
    id: 29,
    category: "Sponsorship & Commercial Value",
    question: "Will brands be able to search for teams and drivers by score?",
    answer:
      "Your individual Score is private by default. PRSC will not make your Score publicly searchable without the appropriate permission from you.",
  },
  {
    id: 30,
    category: "Sponsorship & Commercial Value",
    question: "Are you eventually creating a marketplace?",
    answer:
      "PRSC is not a sponsorship marketplace. The Standard exists to provide a consistent way to measure commercial readiness—not to auction opportunities or broker sponsorship deals.",
  },
  {
    id: 31,
    category: "Sponsorship & Commercial Value",
    question: "Will you introduce me to sponsors?",
    answer:
      "PRSC is not a sponsorship agency and does not promise sponsor placement. The purpose of the Score is to help you understand and demonstrate your readiness when you have commercial conversations.",
  },
  {
    id: 32,
    category: "Sponsorship & Commercial Value",
    question: "If you don't introduce me to sponsors, how exactly does this help me get one?",
    answer:
      "It changes what you bring into the conversation. Instead of relying only on a media kit and your own claims, you can bring an independent measure of your commercial readiness. The Score doesn't get you a sponsor. It helps you walk into the conversation with stronger proof.",
  },
  {
    id: 33,
    category: "Sponsorship & Commercial Value",
    question: "Can I put my Score in my sponsorship deck?",
    answer:
      "Yes, subject to PRSC's applicable use and disclosure rules. Your Score belongs in your commercial story when you decide it is useful to share.",
  },
  {
    id: 34,
    category: "Sponsorship & Commercial Value",
    question: "Can my agency or manager access my report?",
    answer:
      "Yes, if you choose to share it or authorize access. Your individual results remain private by default.",
  },
  {
    id: 35,
    category: "Sponsorship & Commercial Value",
    question: "What does a brand actually receive or see?",
    answer:
      "Nothing individually identifiable simply because you've been scored. You control disclosure of your individual Score. PRSC may use aggregated and anonymized information to build benchmarks without exposing an individual's private results.",
  },
  {
    id: 36,
    category: "The Readiness Vanguard™",
    question: "Why only 25?",
    answer:
      "The Readiness Vanguard™ is intentionally small. The first 25 participants allow PRSC to work closely through the founding scoring cycle while creating the first benchmark dataset behind the Standard.",
  },
  {
    id: 37,
    category: "The Readiness Vanguard™",
    question: "Who gets selected?",
    answer:
      "Selection is based on creating a useful founding cohort—not simply choosing the biggest teams, best-known drivers, or first people to apply. PRSC wants participants capable of helping establish a meaningful benchmark.",
  },
  {
    id: 38,
    category: "The Readiness Vanguard™",
    question: "What does “selection based on fit” actually mean?",
    answer:
      "It means considering factors such as competitive context, participant type, series representation, resource profile, and ability to complete the process. The goal is a useful benchmark, not a popularity contest.",
  },
  {
    id: 39,
    category: "The Readiness Vanguard™",
    question: "Is it first come, first served?",
    answer: "No. Requesting consideration does not automatically guarantee a Vanguard slot.",
  },
  {
    id: 40,
    category: "The Readiness Vanguard™",
    question: "Are you looking for different series, budgets, team sizes, and driver levels?",
    answer:
      "Yes. A useful founding benchmark needs different types of real motorsport programs. The Vanguard is not intended to represent only the largest or best-funded participants.",
  },
  {
    id: 41,
    category: "The Readiness Vanguard™",
    question: "What do the first 25 get that everyone afterward doesn't?",
    answer:
      "Vanguard members help establish the founding benchmark and become part of the first scored cohort under the PRSC Readiness Standard™. They also receive permanent recognition as Readiness Vanguard Founding Members after completing the program requirements.",
  },
  {
    id: 42,
    category: "The Readiness Vanguard™",
    question: "Will my score be compared only with the other 24?",
    answer:
      "No. The Vanguard helps establish the founding benchmark, but the Score is not simply a ranking of 25 people. It is an absolute 0–100 measure calibrated against comparable peer benchmarks. As the benchmark database grows, the context available to the Standard grows with it.",
  },
  {
    id: 43,
    category: "The Readiness Vanguard™",
    question: "What happens after the founding benchmark is created?",
    answer:
      "It becomes the starting reference point for the Standard. As more participants are scored, the benchmark can become broader, deeper, and more useful.",
  },
  {
    id: 44,
    category: "The Readiness Vanguard™",
    question: "When will we receive our scores?",
    answer:
      "The Vanguard is being built to complete the founding scoring and benchmark process before the 2027 racing season. Participants will receive timing and process information during onboarding.",
  },
  {
    id: 45,
    category: "The Readiness Vanguard™",
    question: "What do I have to commit to as a Vanguard member?",
    answer:
      "You need to provide accurate information and required evidence, complete the assessment process, respond to reasonable clarification requests, and follow the Vanguard Participation Agreement.",
  },
  {
    id: 46,
    category: "The Readiness Vanguard™",
    question: "How much time will this take my team?",
    answer:
      "The process is designed to be guided and manageable—not a research project or a giant open-ended questionnaire. Information that can be gathered independently does not need to be recreated by you.",
  },
  {
    id: 47,
    category: "The Readiness Vanguard™",
    question: "What happens if I join and don't complete the process?",
    answer:
      "Vanguard slots are limited. Participants are expected to complete the required process within the timeframe provided during onboarding. A participant who does not complete the requirements may lose their founding slot.",
  },
  {
    id: 48,
    category: "Your Data & Privacy",
    question: "Who owns my data?",
    answer:
      "You retain ownership of the raw information you provide. PRSC may use information as permitted by the applicable participation and privacy terms to calculate scores and create aggregated, anonymized benchmarks.",
  },
  {
    id: 49,
    category: "Your Data & Privacy",
    question: "Are you selling my data?",
    answer:
      "PRSC does not sell your individual identifiable participant information as a list or individual data product. Aggregated and anonymized information may be used to build and improve industry benchmarks without exposing your individual private information.",
  },
  {
    id: 50,
    category: "Your Data & Privacy",
    question: "What exactly gets shared with brands?",
    answer:
      "Your individual Score is private by default. PRSC does not automatically give a brand your private results. You decide when your individual Score is shared.",
  },
  {
    id: 51,
    category: "Your Data & Privacy",
    question: "Can another team see my Score?",
    answer: "Not through PRSC unless you choose to disclose it.",
  },
  {
    id: 52,
    category: "Your Data & Privacy",
    question: "Can a manufacturer see my Score without my permission?",
    answer: "No. Your individual Score is private by default.",
  },
  {
    id: 53,
    category: "Your Data & Privacy",
    question: "Can PRSC publish my Score?",
    answer:
      "Not simply because you've been scored. Public disclosure of an individual Score requires the applicable participant authorization.",
  },
  {
    id: 54,
    category: "Your Data & Privacy",
    question: "What does “aggregated benchmark data” mean?",
    answer:
      "It means information combined across participants so PRSC can understand patterns, ranges, and commercial-readiness benchmarks without identifying your individual private results.",
  },
  {
    id: 55,
    category: "Your Data & Privacy",
    question: "Could someone reverse-engineer my information from the benchmark?",
    answer:
      "PRSC's benchmark approach is designed to aggregate and anonymize participant information so individual private results are not exposed through benchmark reporting.",
  },
  {
    id: 56,
    category: "Your Data & Privacy",
    question: "Where is my data stored?",
    answer:
      "Participant information is maintained within the secure systems used to operate the PRSC scoring process. Specific technical and privacy practices are governed by the applicable PRSC privacy and participation terms.",
  },
  {
    id: 57,
    category: "Your Data & Privacy",
    question: "How secure is the scoring system?",
    answer:
      "Appropriate technical and organizational safeguards are used to protect participant information and control access. PRSC's public security statements will reflect the production systems and controls actually in place.",
  },
  {
    id: 58,
    category: "Your Data & Privacy",
    question: "Can I delete my data?",
    answer:
      "Data rights and retention depend on the type of information and how it has been used. For example, information already incorporated into properly anonymized and aggregated benchmark data is different from identifiable account information. The applicable PRSC Privacy Policy will explain those rights and procedures.",
  },
  {
    id: 59,
    category: "Your Data & Privacy",
    question: "What happens to my data if I leave the program?",
    answer:
      "Your identifiable information continues to be handled under the applicable participation and privacy terms. Information already incorporated into aggregated and anonymized benchmark data may remain part of that benchmark.",
  },
  {
    id: 60,
    category: "Your Data & Privacy",
    question: "Are you pulling data about me that I haven't submitted?",
    answer:
      "Yes, where appropriate and permitted. PRSC may use reliable independent information such as official race results, standings, public audience/platform information, and other relevant sources. One purpose is to reduce the amount you have to submit yourself.",
  },
  {
    id: 61,
    category: "Independence & Governance",
    question: "Why does PRSC need to be independent?",
    answer:
      "Because a credible score cannot be influenced by who pays the most, who has the strongest relationship, or who wants a particular outcome. PRSC is structured to protect the integrity of the Standard and apply it consistently.",
  },
  {
    id: 62,
    category: "Independence & Governance",
    question: "Who is PRSC?",
    answer:
      "The Partnership Readiness Standards Council is the independent body responsible for governing the PRSC Readiness Standard™ and PRSC Readiness Score™.",
  },
  {
    id: 63,
    category: "Independence & Governance",
    question: "Is PRSC a sponsorship agency?",
    answer:
      "No. PRSC does not sell sponsorships, represent teams or drivers in sponsorship negotiations, or take a percentage of your sponsorship deal.",
  },
  {
    id: 64,
    category: "Independence & Governance",
    question: "Who owns the scoring methodology?",
    answer:
      "PRSC owns and governs the PRSC Readiness Standard™, including the methodology behind the Score.",
  },
  {
    id: 65,
    category: "Independence & Governance",
    question: "Who controls the Score?",
    answer:
      "PRSC governs the Standard under which the Score is issued. The scoring methodology is protected and subject to PRSC's governance controls.",
  },
  {
    id: 66,
    category: "Independence & Governance",
    question: "Can a sponsor, agency, team, or investor change my Score?",
    answer:
      "No. Outside commercial interests do not get to negotiate or alter an individual's Score.",
  },
  {
    id: 67,
    category: "Independence & Governance",
    question: "Can someone pay for a better Score?",
    answer:
      "No. Paying PRSC, hiring a particular provider, buying a service, or having an important relationship does not entitle anyone to a higher Score.",
  },
  {
    id: 68,
    category: "Independence & Governance",
    question: "Who can change the methodology?",
    answer:
      "Changes to the Standard are governed through PRSC's formal methodology and governance process. Participants and outside commercial interests cannot simply request a scoring change that benefits them.",
  },
  {
    id: 69,
    category: "Independence & Governance",
    question: "Who oversees the methodology?",
    answer:
      "PRSC's Methodology Committee oversees the integrity of the scoring model. Its responsibilities include expert validation of key dimensions, mathematical integrity, calibration, and ensuring the model remains statistically and commercially defensible. Before any scores are published, the first cohort of scores undergoes a full quality assurance review by the Methodology Committee to validate accuracy and calibration.",
  },
  {
    id: 70,
    category: "Independence & Governance",
    question: "Does a person decide what Score I deserve?",
    answer:
      "No. The Score is produced through a governed methodology using evidence and data. Human expertise protects the integrity of the methodology and helps ensure that the model and its calibration remain defensible—it is not a process of deciding who “deserves” a particular number.",
  },
  {
    id: 71,
    category: "Independence & Governance",
    question: "How do you prevent commercial interests from influencing the Standard?",
    answer:
      "PRSC uses governance controls, protected methodology, conflict safeguards, evidence requirements, and separation from sponsorship transactions. The Standard is designed so commercial relationships do not determine scoring outcomes.",
  },
  {
    id: 72,
    category: "Why Trust PRSC?",
    question: "Who created the methodology?",
    answer:
      "The PRSC Readiness Standard™ was developed by PRSC's founding team, drawing on expertise in commercial measurement, audience intelligence, motorsport partnerships, and composite scoring methodology. It is governed and validated through the PRSC Methodology Committee, which exists to protect the model's integrity before real scores are issued.",
  },
  {
    id: 73,
    category: "Why Trust PRSC?",
    question: "What qualifies PRSC to establish a Standard?",
    answer:
      "PRSC doesn't believe authority comes from simply calling something a standard. It comes from building a rigorous methodology, applying it consistently, protecting its independence, testing it against real evidence, and earning market trust over time.",
  },
  {
    id: 76,
    category: "Why Trust PRSC?",
    question: "Has the methodology been independently tested?",
    answer:
      "The Standard is in its founding validation phase. The Readiness Vanguard™ — a curated cohort of 25 teams, drivers, brands, and agencies — is the designed validation environment. It will produce the first real benchmark dataset and the first evidence base needed to test, calibrate, and strengthen the methodology against real commercial outcomes.",
  },
  {
    id: 77,
    category: "Why Trust PRSC?",
    question: "What evidence shows these six dimensions predict sponsorship readiness?",
    answer:
      "That's exactly what the founding benchmark and the data that follow it are intended to test. PRSC is building the evidence rather than claiming that a new Standard has already proven everything it ultimately intends to measure.",
  },
  {
    id: 78,
    category: "Why Trust PRSC?",
    question: "Will the methodology change as you get more data?",
    answer:
      "It can evolve as the evidence base grows. Any changes are governed through PRSC's methodology process. The goal is to improve the Standard while preserving consistency, integrity, and comparability.",
  },
  {
    id: 80,
    category: "Why Trust PRSC?",
    question: "What makes this different from existing sponsorship valuation tools?",
    answer:
      "PRSC is not simply calculating media value, impressions, or logo exposure. It measures commercial readiness: whether you have the capabilities and evidence to attract, deliver, measure, and sustain a partnership.",
  },
  {
    id: 81,
    category: "Cost",
    question: "How much does the PRSC Readiness Score™ cost?",
    answer: "The PRSC Readiness Score™ is always free for teams and drivers.",
  },
  {
    id: 82,
    category: "Cost",
    question: "Why is the Score free?",
    answer:
      "Because a credible industry standard should not exclude a team or driver simply because they cannot afford to be measured. Broad participation also helps create a stronger and more representative benchmark.",
  },
  {
    id: 83,
    category: "Cost",
    question: "Is free scoring only for Vanguard members?",
    answer:
      "No. The PRSC Readiness Score™ is always free for teams and drivers. Vanguard membership provides founding-participant benefits beyond simply receiving a Score.",
  },
  {
    id: 84,
    category: "Cost",
    question: "Will I have to pay to see my Score?",
    answer: "No. Teams and drivers are not charged to receive their PRSC Readiness Score™.",
  },
  {
    id: 85,
    category: "Cost",
    question: "Will I eventually have to pay to be scored?",
    answer: "No. The PRSC Readiness Score™ is always free for teams and drivers.",
  },
  {
    id: 86,
    category: "Cost",
    question: "Do I have to buy anything after receiving my Score?",
    answer: "No. Receiving a Score does not require you to purchase another product or service.",
  },
  {
    id: 87,
    category: "Cost",
    question: "Does PRSC take a commission if I later get a sponsor?",
    answer:
      "No. PRSC is not a sponsorship broker and does not take a percentage of sponsorship deals because you received a Score.",
  },
  {
    id: 88,
    category: "Cost",
    question: "Is there a catch?",
    answer:
      "No. Your Score is always free. You are not required to buy services, hire a particular provider, or give PRSC a percentage of future sponsorship revenue.",
  },
  {
    id: 89,
    category: "Getting Started",
    question: "What do I have to do first?",
    answer:
      "Start by requesting consideration for the Readiness Vanguard™. If selected, you'll receive clear onboarding instructions and access to the evidence-submission process.",
  },
  {
    id: 90,
    category: "Getting Started",
    question: "What documents should I start gathering?",
    answer:
      "Useful information may include sponsorship agreements, partnership history, activation examples, audience information, media or measurement reports, commercial materials, and other documentation that helps demonstrate how you currently operate. You won't need to recreate information PRSC can reliably obtain elsewhere.",
  },
  {
    id: 91,
    category: "Getting Started",
    question: "I don't have a marketing department. Can I still do this?",
    answer:
      "Yes. You don't need a marketing department or a large commercial staff. PRSC is measuring where you are today and how effectively you use what you have.",
  },
  {
    id: 92,
    category: "Getting Started",
    question: "I don't understand audience analytics. Can I still participate?",
    answer:
      "Yes. You are not expected to become a measurement expert before being scored. The process is designed to ask for understandable evidence and use reliable independent information where available.",
  },
  {
    id: 94,
    category: "Getting Started",
    question: "I'm an individual driver, not a team. Does this work for me?",
    answer: "Yes. The PRSC Readiness Score™ is designed for individual drivers as well as teams.",
  },
  {
    id: 95,
    category: "Getting Started",
    question: "I'm just starting out. Am I too small?",
    answer:
      "No. Size is not the same as readiness. The Score doesn't ask whether you have the same resources as a factory team. It asks what you're doing with what you have—and whether you can prove it.",
  },
  {
    id: 96,
    category: "Getting Started",
    question: "What if I've never had a sponsor?",
    answer:
      "You can still be assessed. Your partnership history is one part of a much broader picture. The Score can help establish where you are today and identify commercial capabilities that still need to be built.",
  },
  {
    id: 97,
    category: "Getting Started",
    question: "What if most of my sponsors are local businesses?",
    answer:
      "They count. The size of a sponsor does not automatically determine the quality of your commercial execution. How you manage the relationship, deliver what you promised, activate the partnership, and demonstrate value all matter.",
  },
  {
    id: 98,
    category: "Getting Started",
    question: "Can my manager fill this out for me?",
    answer:
      "An authorized manager or representative can help with the process, provided the information submitted is accurate and they are authorized to provide it on your behalf.",
  },
  {
    id: 99,
    category: "Getting Started",
    question: "How long does onboarding take?",
    answer:
      "Onboarding is designed to be straightforward and guided. Participants receive clear instructions on what is needed and what information can be gathered independently.",
  },
  {
    id: 100,
    category: "Getting Started",
    question: "Where do I sign up?",
    answer:
      "Use the Request Consideration form on the Readiness Vanguard™ page. Submitting the form starts the review process; it does not automatically guarantee one of the 25 founding Vanguard slots.",
  },
];
