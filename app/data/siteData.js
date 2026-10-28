/**
 * The built-in portfolio content: what the homepage shows until a version is published from
 * Admin → Content. The resume file itself is uploaded in Admin → Documents, not kept in the code.
 */

export const profile = {
  firstName: "BURHANUDDIN",
  lastName: "CHITALWALA",
  introCard: "A PORTFOLIO BY",
  role: "Full-Stack Engineer",
  yearsExperience: "3+",
  focusAreas: ["Next.js", "Java · Python", "AI / LLM systems"],
  logline:
    "A full-stack engineer with 3+ years shipping AI-powered products at InMobi and Stellantis, from an LLM voice assistant live in a car to an AI layer that plans ad campaigns.",
  /** Shown in About as "Open to" when set. Left empty on purpose. */
  openTo: "",
  summary: [
    "Full-stack engineer with 3+ years building and shipping AI-powered products at global companies. I own features end to end, across Java and Python backends and Next.js and React frontends.",
    "I've shipped production LLM systems in a live vehicle, and I'm strongest in AI integration, scalable server-rendered web platforms and design systems, always with an eye on measurable business impact.",
  ],
  /** From the public LeetCode profile. Update when the numbers change. */
  problemSolving: {
    solved: 555,
    medium: 296,
    hard: 54,
    language: "Java",
    strengths: ["Dynamic programming", "Graphs", "Trees", "Hash tables"],
    badges: "100 Days Badge 2025 and 50 Days Badges in 2023, 2024 and 2025",
  },
  location: "Bengaluru, India",
  email: "burhanuddinchital25151@gmail.com",
  // Serves the PDF chosen as the site resume in Admin → Documents.
  resumePdf: "/api/resume",
  // The built-in profile photo, used until another is uploaded in Admin → Content.
  portrait: {
    src: "/img/portrait.jpg",
    alt: "Portrait of Burhanuddin Chitalwala",
    // Background-removed version for the hero, and its size (for the layout's aspect ratio).
    cutout: "/img/portrait-cutout.webp",
    cutoutWidth: 632,
    cutoutHeight: 1016,
  },
  heroTags: ["LLM-powered", "Next.js · Java · Python"],
  links: {
    linkedin: "https://www.linkedin.com/in/cburhanuddin/",
    github: "https://github.com/burhanuddin-chitalwala17",
    leetcode: "https://leetcode.com/u/burhanuddinchital25151/",
    twitter: "https://twitter.com/BChital",
    instagram: "https://www.instagram.com/burhanuddin.chitalwala/",
  },
};

export const education = {
  school: "Vellore Institute of Technology (VIT University)",
  degree: "B.Tech in Computer Science and Engineering",
  score: "CGPA 7.9",
};

/** Jobs, oldest first. Each resume point is a highlight. */
export const experience = [
  {
    years: "2023",
    company: "ITR Consulting",
    role: "Software Developer Intern",
    place: "Illinois, US (Remote)",
    period: "Jul 2023 – Jan 2024",
    logline: "An IT services company delivering software for clients.",
    highlights: [
      {
        title: "High-traffic web app",
        text: "Built a high-traffic web application with Laravel and Vue.js serving 2,000+ daily users, using an MVC architecture and REST APIs to improve cross-platform UI responsiveness.",
      },
    ],
  },
  {
    years: "2024–25",
    company: "Stellantis",
    role: "Software Developer",
    place: "Bengaluru, India",
    period: "Feb 2024 – Jul 2025",
    logline: "A global automotive manufacturer.",
    highlights: [
      {
        title: "AI voice assistant",
        text: "Built an AI-powered in-car voice assistant integrating GPT-4o, Gemini, DeepSeek and Realtime AI across a 14-feature suite, now live in the Citroën Basalt X as CARA. Its subscription model is projected to generate $786M+ in revenue.",
      },
      {
        title: "Alexa Skills for 14 brands",
        text: "Developed Alexa Skills for voice-controlled vehicle operations across 14 brands, including Jeep, Maserati and Alfa Romeo.",
      },
      {
        title: "Echo Show interfaces",
        text: "Built responsive multimodal interfaces for Echo Show devices, increasing user engagement by 27%.",
      },
      {
        title: "Refactoring for scale",
        text: "Refactored core systems for MVVM compliance and reusability.",
      },
    ],
  },
  {
    years: "2025–now",
    company: "InMobi",
    role: "Full Stack Developer",
    place: "Bengaluru, India",
    period: "Jul 2025 – Present",
    current: true,
    logline: "A global AdTech leader for intelligent, data-driven advertising.",
    highlights: [
      {
        title: "InMobi Accelerate",
        text: "Building InMobi Accelerate, an omnichannel performance-marketing platform where an AI chat layer generates media plans, market research and optimised campaign and budget strategies. I own features end to end across Java and Python services and the Next.js frontend.",
      },
      {
        title: "Design system & UI revamp",
        text: "Building the go-to-market UI revamp on a layered design system (primitive and semantic tokens, shadcn and Radix primitives, composite components, layouts), modernising the product under tight deadlines without disrupting the live product.",
      },
      {
        title: "Server-rendered ad publishing",
        text: "Led frontend development of the server-side-rendered ad publishing platform (Next.js, TypeScript, Tailwind), improving SEO and campaign management efficiency.",
      },
      {
        title: "Internal AI tool with Claude",
        text: "Built an internal tool using Claude that turns client-meeting minutes into structured signals and action items, replacing hours of cross-team discussion with reusable product insights.",
      },
    ],
  },
];

/** Projects, shown as cards. `art` sets each card's gradient. */
export const projects = [
  {
    id: "this-portfolio",
    title: "This Portfolio",
    subtitle: "AI chat + headless CMS",
    kind: "Live · Personal",
    art: { from: "#0b0b0d", via: "#a16207", to: "#f5b83d" },
    logline: "The site you're on: an AI version of me that answers from my own documents, and a CMS that rewrites the site from a new resume once I approve it.",
    points: [
      "Chat grounded in my resume and uploaded notes, built on Claude with streaming replies, prompt caching and a tool that files unanswered questions into my admin inbox.",
      "Upload a new resume and Claude drafts the updated site as validated, versioned content; nothing goes live until I review the diff and publish, with one-click rollback.",
      "Privacy by design: every upload is scanned for IDs, bank details, secrets and contact info, risky files stay out of the chat, and detected values are redacted before the model sees them.",
      "Portable backend (Drizzle on any Postgres, any S3-compatible storage), signed admin sessions with login lockout, and per-visitor rate limits on the chat.",
      "Design-token system with fluid typography, Framer Motion and Lenis, tested on phones, tablets and desktop.",
    ],
    tech: ["Next.js 16", "React 19", "Claude API", "Drizzle", "Postgres", "S3", "Framer Motion", "Tailwind"],
    links: [{ label: "View code", href: "https://github.com/burhanuddin-chitalwala17/portfolio" }],
  },
  {
    id: "creddev",
    title: "CredDev",
    subtitle: "AI credibility reports",
    kind: "Live · Personal",
    art: { from: "#0f172a", via: "#2563eb", to: "#5eead4" },
    logline: "An AI platform that pulls a developer's data from GitHub, LeetCode, LinkedIn and other platforms and turns it into credibility reports.",
    points: [
      "Full-stack AI platform built with Next.js 16, FastAPI and PostgreSQL.",
      "Aggregates developer data from GitHub, LeetCode, LinkedIn and other platforms to generate credibility reports with OpenAI GPT.",
      "Backed by a 7-point anti-hallucination guardrail system.",
      "Real-time 12-state chat agent, progressive OAuth authentication and graceful degradation across multi-platform data fetchers, following SOLID principles.",
    ],
    tech: ["Next.js 16", "FastAPI", "PostgreSQL", "OpenAI GPT", "OAuth"],
    links: [
      { label: "Visit site", href: "https://cred-dev17.vercel.app" },
      { label: "View code", href: "https://github.com/burhanuddin-chitalwala17/cred-dev" },
    ],
  },
  {
    id: "bhendi-bazaar",
    title: "Bhendi Bazaar",
    subtitle: "Multi-tenant commerce",
    kind: "Live · Personal",
    art: { from: "#431407", via: "#ea580c", to: "#fde68a" },
    logline: "An e-commerce platform that gives small businesses their own branded storefront, live in production with a real seller.",
    points: [
      "Full-stack platform built with Next.js, TypeScript, Prisma, Supabase/PostgreSQL and Vercel.",
      "Each business gets a branded storefront and landing page, with inventory management and an org portal for order tracking.",
      "Complete buyer flow (catalogue, cart and checkout) with orders routed to each seller's dashboard.",
      "Designing AI-assisted marketplace listings that store a seller's business context once and reuse it to generate listings for Amazon, Flipkart and Meesho.",
    ],
    tech: ["Next.js", "TypeScript", "Prisma", "Supabase", "PostgreSQL", "Vercel"],
    links: [{ label: "Visit site", href: "https://bhendi-bazaar.com" }],
  },
  {
    id: "synthesiser",
    title: "Synthesiser",
    subtitle: "Client feedback AI",
    kind: "Personal",
    art: { from: "#1e1b4b", via: "#7c3aed", to: "#f5b83d" },
    logline: "Paste raw client-meeting notes and AI extracts the signals, building a live cross-client analysis your team can chat with.",
    points: [
      "AI extracts structured signals from session notes and files (TXT, PDF, CSV, DOCX, JSON): pain points, must-haves, blockers, urgency and sentiment.",
      "RAG chat over every captured session with citations, using pgvector semantic search plus a database query tool, with up to 5 chat streams running in parallel.",
      "Live insights dashboard, embedding-based theme de-duplication, real-time notifications and team workspaces with role-based access.",
      "Provider-agnostic AI layer that switches between Anthropic, OpenAI and Google through configuration.",
    ],
    tech: ["Next.js", "Vercel AI SDK", "Supabase", "pgvector", "Claude", "OpenAI"],
    links: [{ label: "View code", href: "https://github.com/burhanuddin-chitalwala17/client-feedback-synthesis" }],
  },
  {
    id: "textbook-rag",
    title: "Textbook Q&A",
    subtitle: "RAG over PDFs",
    kind: "Personal",
    art: { from: "#022c22", via: "#059669", to: "#fef08a" },
    logline: "Upload a textbook PDF and ask it questions, with answers grounded only in the book.",
    points: [
      "Retrieval-augmented generation pipeline: PDF extraction, chunking, embeddings and vector search in Pinecone.",
      "FastAPI backend with a Streamlit chat interface.",
      "System prompt enforces grounded answers only, with tests for the chunker.",
    ],
    tech: ["Python", "FastAPI", "OpenAI", "Pinecone", "Streamlit"],
    links: [{ label: "View code", href: "https://github.com/burhanuddin-chitalwala17/book-bitch" }],
  },
  {
    id: "basalt-assistant",
    title: "CARA",
    subtitle: "Citroën's in-car AI companion",
    kind: "Stellantis",
    art: { from: "#0c4a6e", via: "#0891b2", to: "#a7f3d0" },
    logline:
      "A hands-free, LLM-powered voice assistant built at Stellantis' Bengaluru tech hub, launched by Citroën in the Basalt X as CARA, \"India's first intelligent in-car companion\".",
    points: [
      "Integrated GPT-4o, Gemini, DeepSeek and Realtime AI to enable hands-free operations.",
      "Shipped a 14-feature suite that is now live in the Citroën Basalt X.",
      "Its subscription model is projected to generate $786M+ in revenue.",
      "At launch in September 2025, Citroën highlighted support for 52 languages, vehicle insights like tyre pressure and fuel, remote controls, and voice-triggered SOS and crash response.",
    ],
    tech: ["GPT-4o", "Gemini", "DeepSeek", "Realtime AI"],
    links: [
      {
        label: "Citroën's announcement",
        href: "https://www.citroen.in/about-citroen/news/citroen-basalt-intelligent-in-car-assistant.html",
      },
    ],
  },
  {
    id: "media-planner",
    title: "InMobi Accelerate",
    subtitle: "Agentic AI ad platform",
    kind: "InMobi",
    art: { from: "#111827", via: "#4338ca", to: "#f472b6" },
    logline:
      "InMobi's AI-native omnichannel advertising platform: paste a website link and AI agents plan, create and launch cross-channel campaigns in minutes.",
    points: [
      "AI chat layer that generates media plans, market research and optimised campaign and budget strategies.",
      "Features owned end to end across Java and Python services and the Next.js frontend.",
      "UI revamp on a layered design system built from tokens, shadcn and Radix primitives.",
      "Accelerate analyses an advertiser's website to build media plans, creatives, targeting and budgets across Google, Meta, Microsoft and more, with one-click launch and conversational analytics.",
    ],
    tech: ["Next.js", "Java", "Python", "LLMs", "shadcn/ui"],
    links: [{ label: "Visit Accelerate", href: "https://accelerate.inmobi.com" }],
  },
  {
    id: "alexa-skills",
    title: "Alexa Skills",
    subtitle: "14 automotive brands",
    kind: "Stellantis",
    art: { from: "#450a0a", via: "#b91c1c", to: "#fb923c" },
    logline: "Voice-controlled vehicle operations for 14 brands, including Jeep, Maserati and Alfa Romeo.",
    points: [
      "Developed Alexa Skills for voice-controlled vehicle operations across 14 brands.",
      "Built responsive multimodal UIs for Echo Show devices, increasing engagement by 27%.",
      "Refactored for MVVM compliance and reuse.",
    ],
    tech: ["Alexa Skills", "Echo Show", "Voice UX", "MVVM"],
  },
];

/** Headline numbers from the resume, biggest first. */
export const impactNumbers = [
  { value: "$786M+", label: "projected subscription revenue for the in-car AI assistant", source: "Stellantis" },
  { value: "14", label: "car brands with voice-controlled Alexa Skills", source: "Stellantis" },
  { value: "27%", label: "more engagement on Echo Show interfaces", source: "Stellantis" },
  { value: "2,000+", label: "daily users on a high-traffic web app", source: "ITR Consulting" },
  { value: "555", label: "LeetCode problems solved, including 296 medium and 54 hard", source: "LeetCode" },
  { value: "3+", label: "years shipping AI-powered products", source: "Career" },
];

export const skillGroups = [
  { name: "Languages", items: ["Java", "Python", "TypeScript", "JavaScript", "Kotlin", "SQL", "PHP"] },
  {
    name: "Frontend",
    items: ["Next.js", "React", "Tailwind CSS", "shadcn/ui", "Radix UI", "Design systems", "SSR / SEO"],
  },
  { name: "Backend", items: ["Node.js", "FastAPI", "REST APIs", "Prisma", "OAuth"] },
  {
    name: "AI / LLM",
    items: ["OpenAI API", "GPT-4o", "Gemini", "DeepSeek", "Claude", "Realtime AI", "RAG", "AI agents", "Prompt engineering", "Hallucination guardrails"],
  },
  { name: "Data & Cloud", items: ["PostgreSQL", "Supabase", "MySQL", "MongoDB", "Vercel"] },
  {
    name: "Practices",
    items: ["System design", "DS & Algo", "SOLID", "OOP", "MVVM", "Git", "AI-assisted development"],
  },
];

/** Photos from outside work. `position` keeps the subject in frame when the photo is cropped to a card. */
export const beyondWork = [
  { src: "/img/life/pondicherry.jpg", alt: "Burhanuddin smiling outside a yellow heritage building in Pondicherry", position: "50% 55%" },
  { src: "/img/life/surf-board.jpg", alt: "Burhanuddin standing beside a surfboard on the beach", position: "50% 45%" },
  { src: "/img/life/kitten.jpg", alt: "Burhanuddin holding a fluffy kitten on the beach", position: "50% 40%" },
  { src: "/img/life/home-cooking.jpg", alt: "A home-cooked platter of chicken in white sauce, corn, roasted vegetables and fries", position: "50% 45%" },
  { src: "/img/life/kayak.jpg", alt: "Burhanuddin kayaking with family on a lake full of lily pads", position: "50% 62%" },
  { src: "/img/life/gym.jpg", alt: "Burhanuddin taking a mirror selfie at the gym", position: "50% 45%" },
  { src: "/img/life/beach-selfie.jpg", alt: "Burhanuddin grinning in sunglasses above the Pondicherry promenade", position: "47% 50%" },
  { src: "/img/life/surf-sitting.jpg", alt: "Burhanuddin sitting on a surfboard at the water's edge, watching the waves", position: "50% 68%" },
  { src: "/img/life/pier.jpg", alt: "Waves breaking beside an old pier under a clear sky", position: "55% 60%" },
  { src: "/img/life/stand-up.jpg", alt: "Burhanuddin performing stand-up comedy on stage", position: "50% 40%" },
];

/** What the chat can say about life outside work. */
export const outsideWork = ["travelling", "food and cooking", "family time", "animals", "surfing and kayaking", "the gym", "stand-up comedy"];

/** Slides for the "Quick intro" slideshow. */
export const introSlides = [
  { eyebrow: "Hello, I'm", title: "BURHANUDDIN", text: "A full-stack engineer from VIT who ships AI-powered products." },
  { eyebrow: "2023", title: "2,000+ DAILY USERS", text: "An internship at ITR Consulting: a high-traffic Laravel + Vue.js app." },
  { eyebrow: "2024", title: "AI ON THE ROAD", text: "CARA, an LLM voice assistant live in the Citroën Basalt X, plus Alexa Skills for 14 car brands." },
  { eyebrow: "Today", title: "AI FOR ADVERTISERS", text: "At InMobi, building Accelerate, where AI agents plan, create and launch ad campaigns." },
  { eyebrow: "What's next", title: "TO BE CONTINUED…", text: "More challenges to take on, more products to build, more to innovate. The best chapter is still being written." },
];

/** Visitor types for the welcome screen. Each one only changes the order of sections. */
export const visitorTypes = [
  {
    id: "recruiter",
    name: "Recruiter",
    blurb: "Experience and impact first",
    color: "from-category-1 to-category-1-deep",
    order: ["experience", "impact", "projects", "skills", "about", "beyond"],
  },
  {
    id: "engineer",
    name: "Engineer",
    blurb: "Projects and stack first",
    color: "from-category-2 to-category-2-deep",
    order: ["projects", "skills", "experience", "impact", "about", "beyond"],
  },
  {
    id: "browsing",
    name: "Just browsing",
    blurb: "The person first",
    color: "from-category-4 to-category-4-deep",
    order: ["about", "experience", "projects", "beyond", "impact", "skills"],
  },
];

export const navSections = [
  { id: "experience", label: "Experience" },
  { id: "projects", label: "Projects" },
  { id: "skills", label: "Skills" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

/**
 * The editable part of the homepage. The admin panel publishes new versions of this shape;
 * these values are what the site shows until the first version is published.
 */
export const defaultContent = { profile, education, experience, projects, impactNumbers, skillGroups, introSlides };
