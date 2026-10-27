/**
 * All portfolio content lives here, taken from public/docs/resume.pdf.
 * Every section of the "series" reads from this file, so update facts here.
 */

export const profile = {
  firstName: "BURHANUDDIN",
  lastName: "CHITALWALA",
  seriesTag: "THE SERIES",
  studioCard: "A CHITALWALA PRODUCTION",
  role: "Full-Stack Software Developer",
  genres: ["Next.js", "Android · Kotlin", "LLM systems"],
  logline:
    "A full-stack developer with 1.5+ years of shipping AI-powered web and mobile products, from voice assistants in cars to ad platforms used across the globe.",
  summary: [
    "Results-driven full-stack software developer with 1.5+ years of experience building scalable, AI-powered web and mobile applications.",
    "I've shipped production features across Next.js, Android (Kotlin) and LLM-integrated systems. I care about modular frontends, clean backend communication and solutions that move real numbers for users and the business.",
  ],
  location: "Bengaluru, India",
  email: "burhanuddinchital25151@gmail.com",
  resumePdf: "/docs/resume.pdf",
  portrait: {
    src: "/img/burhanuddin-portrait.jpg",
    alt: "Portrait of Burhanuddin Chitalwala",
  },
  links: {
    linkedin: "https://www.linkedin.com/in/cburhanuddin/",
    github: "https://github.com/SatanSanta17",
    twitter: "https://twitter.com/BChital",
    instagram: "https://www.instagram.com/burhanuddin.chitalwala/",
  },
};

export const education = {
  school: "Vellore Institute of Technology (VIT University)",
  degree: "B.Tech in Computer Science and Engineering",
  score: "CGPA 7.9",
};

/** Experience, oldest first. Each job is a season and each resume point an episode. */
export const seasons = [
  {
    number: 1,
    title: "The Internship",
    company: "ITR Consulting",
    role: "Software Developer Intern",
    place: "Illinois, US",
    period: "Jul 2023 – Jan 2024",
    logline: "A consulting firm specializing in IT solutions and software development.",
    episodes: [
      {
        title: "Rush Hour",
        text: "Engineered a high-traffic web application serving 2,000+ daily users with a Laravel + Vue.js stack.",
      },
      {
        title: "Blueprints",
        text: "Improved cross-platform UI responsiveness and implemented an MVC architecture for scalable backend logic and REST APIs.",
      },
    ],
  },
  {
    number: 2,
    title: "Voice of the Machine",
    company: "Stellantis",
    role: "Software Developer",
    place: "Bengaluru, India",
    period: "Feb 2024 – Jul 2025",
    logline: "An automotive manufacturer that designs and produces vehicles.",
    episodes: [
      {
        title: "Fourteen Brands",
        text: "Built Alexa Skills for 14 iconic automotive brands (Jeep, Maserati, Alfa Romeo and more), enabling voice-controlled vehicle operations for over 5 million users.",
      },
      {
        title: "On the Big Screen",
        text: "Developed responsive multimodal interfaces for Echo Show devices, boosting user engagement by 27%.",
      },
      {
        title: "The Assistant",
        text: "Developed an AI-powered voice assistant integrating LLMs (GPT-4o, Gemini, DeepSeek, Realtime AI) with a 14-feature suite, now live in the Citroën Basalt X. Its subscription model is projected to generate at least $786M in revenue.",
      },
      {
        title: "Paying Down Debt",
        text: "Refactored code for scalability, reusability and MVVM compliance, saving 20 man-hours per sprint and speeding up future iterations.",
      },
      {
        title: "The Panel",
        text: "Conducted technical interviews for tech lead roles, helping hire high-caliber engineers for critical projects.",
      },
    ],
  },
  {
    number: 3,
    title: "Ad Infinitum",
    company: "InMobi",
    role: "Full Stack Developer",
    place: "Bengaluru, India",
    period: "Jul 2025 – Present",
    current: true,
    logline:
      "A global AdTech leader empowering brands with intelligent, data-driven advertising across web, app and connected devices.",
    episodes: [
      {
        title: "Omnichannel",
        text: "Frontend development for an Omnichannel Ad Publishing Platform with Next.js, TypeScript and Tailwind CSS, making campaign management more efficient.",
      },
      {
        title: "The Datatable",
        text: "Designed a reusable Datatable with server-side sorting, pagination and dynamic data binding, now used across multiple modules and boosting development velocity by 40%.",
      },
      {
        title: "First Impressions",
        text: "Built the landing and business pages and optimized rendering performance for large asset files.",
      },
      {
        title: "Foundations",
        text: "Contributed to frontend architecture and design decisions for scalability, clean state management and seamless backend integration.",
      },
    ],
  },
];

/** Projects, shown as posters. `art` sets each poster's gradient. */
export const originals = [
  {
    id: "pickme",
    title: "pickMe",
    subtitle: "AI job portal",
    kind: "Personal project",
    art: { from: "#3b0764", via: "#7c3aed", to: "#f5b83d" },
    logline: "A MERN job portal where an LLM writes the screening tasks, turning hours of work into seconds.",
    points: [
      "Built a full-stack job portal using MongoDB, Express.js, React.js and Node.js.",
      "Integrated Google LLM models for AI-driven task generation, reducing bias and employer workload: a process that took tens of hours now takes seconds.",
      "Used prompt engineering to generate relevant tasks from job descriptions.",
      "Developed and tested RESTful APIs and integrated MongoDB for its ease of integration and community support.",
    ],
    tech: ["MongoDB", "Express.js", "React.js", "Node.js", "Google LLMs"],
    link: { label: "View on GitHub", href: "https://github.com/SatanSanta17/pickMe" },
  },
  {
    id: "basalt-assistant",
    title: "Basalt X",
    subtitle: "In-car AI assistant",
    kind: "Stellantis",
    art: { from: "#0c4a6e", via: "#0891b2", to: "#a7f3d0" },
    logline: "A hands-free, LLM-powered voice assistant with 14 features, live in the Citroën Basalt X.",
    points: [
      "Integrated GPT-4o, Gemini, DeepSeek and Realtime AI to enable hands-free operations.",
      "Shipped a 14-feature suite that is now live in the Citroën Basalt X.",
      "Its subscription model is projected to generate at least $786M in revenue.",
    ],
    tech: ["GPT-4o", "Gemini", "DeepSeek", "Realtime AI"],
  },
  {
    id: "alexa-skills",
    title: "Drive by Voice",
    subtitle: "Alexa Skills × 14 brands",
    kind: "Stellantis",
    art: { from: "#450a0a", via: "#b91c1c", to: "#fb923c" },
    logline: "Voice-controlled vehicle operations for Jeep, Maserati, Alfa Romeo and 11 more brands.",
    points: [
      "Developed Alexa Skills for 14 automotive brands, reaching over 5 million users.",
      "Built responsive multimodal UIs for Echo Show devices, boosting engagement by 27%.",
      "Refactored for MVVM compliance and reuse, saving 20 man-hours per sprint.",
    ],
    tech: ["Alexa Skills", "Echo Show", "Voice UX", "MVVM"],
  },
  {
    id: "ad-platform",
    title: "Omnichannel",
    subtitle: "Ad publishing platform",
    kind: "InMobi",
    art: { from: "#111827", via: "#4338ca", to: "#f472b6" },
    logline: "The frontend of an ad publishing platform, built around a Datatable the whole team now reuses.",
    points: [
      "Frontend development with Next.js, TypeScript and Tailwind CSS for campaign management.",
      "Reusable Datatable with server-side sorting, pagination and dynamic data binding, boosting development velocity by 40%.",
      "Landing and business pages, with rendering optimized for large asset files.",
    ],
    tech: ["Next.js", "TypeScript", "Tailwind CSS"],
  },
  {
    id: "weather",
    title: "Forecast",
    subtitle: "Weather app",
    kind: "Personal project",
    art: { from: "#082f49", via: "#0284c7", to: "#fde68a" },
    logline: "A Flask weather forecasting app powered by real-time data from the Tomorrow.io APIs.",
    points: ["Built a weather forecasting app using Flask with Tomorrow.io APIs for real-time weather data."],
    tech: ["Flask", "Python", "Tomorrow.io API"],
  },
  {
    id: "task-scheduler",
    title: "Taskmaster",
    subtitle: "Task scheduler",
    kind: "Personal project",
    art: { from: "#052e16", via: "#15803d", to: "#bef264" },
    logline: "A Flask and MongoDB task scheduler with a responsive Bootstrap UI.",
    points: [
      "Developed a Flask-based task scheduler with MongoDB.",
      "Responsive Bootstrap UI with CRUD operations and task sorting in JavaScript.",
    ],
    tech: ["Flask", "MongoDB", "Bootstrap", "JavaScript"],
  },
];

/** Headline numbers from the resume, in ranked order. */
export const topNumbers = [
  { value: "5M+", label: "users reached by voice-controlled vehicle skills", source: "Stellantis" },
  { value: "$786M", label: "projected subscription revenue for the AI assistant", source: "Stellantis" },
  { value: "40%", label: "faster development with a shared Datatable", source: "InMobi" },
  { value: "27%", label: "more engagement on Echo Show interfaces", source: "Stellantis" },
  { value: "14", label: "automotive brands given a voice", source: "Stellantis" },
  { value: "20h", label: "saved every sprint through refactoring", source: "Stellantis" },
  { value: "2,000+", label: "daily users on a high-traffic web app", source: "ITR Consulting" },
];

export const skillGenres = [
  { genre: "Languages", items: ["Java", "Python", "JavaScript", "Kotlin", "SQL", "PHP"] },
  {
    genre: "Frameworks & Libraries",
    items: ["Next.js", "React.js", "Node.js", "Flask", "Laravel", "Vue.js", "Bootstrap"],
  },
  { genre: "Databases", items: ["MongoDB", "MySQL"] },
  {
    genre: "Tools & Foundations",
    items: ["Cursor", "Android Studio", "Git", "VS Code", "Postman", "DS & Algo", "OOP"],
  },
];

export const behindTheScenes = [
  { src: "/img/carousel/slider-img-1(1).jpg", alt: "Burhanuddin holding a football on the pitch", title: "Tournament Winners" },
  { src: "/img/carousel/slider-img-2(1).jpg", alt: "Burhanuddin with a trophy and golden boot", title: "Tournament Champions" },
  { src: "/img/carousel/slider-img-3(1).jpg", alt: "Burhanuddin with a trophy at a night match", title: "Best Player of the Tournament" },
  { src: "/img/carousel/slider-img-4(1).jpeg", alt: "Burhanuddin performing on stage with a microphone", title: "Stand-Up Battle Winner" },
];

/** Slides for the "Play Intro" highlight reel. */
export const introSlides = [
  { eyebrow: "Previously on", title: "BURHANUDDIN", text: "A computer science graduate from VIT starts writing code for real users." },
  { eyebrow: "Season 1", title: "2,000+ DAILY USERS", text: "An internship at ITR Consulting: a high-traffic Laravel + Vue.js app." },
  { eyebrow: "Season 2", title: "5 MILLION VOICES", text: "Alexa Skills for 14 car brands, and an LLM assistant live in the Citroën Basalt X." },
  { eyebrow: "Season 3", title: "NOW STREAMING", text: "Building an omnichannel ad publishing platform at InMobi with Next.js." },
  { eyebrow: "Next episode", title: "YOUR TEAM?", text: "Open to conversations about full-stack, mobile and AI products." },
];

/** "Who's watching?" profiles. Each one only changes the order of sections. */
export const viewerProfiles = [
  {
    id: "recruiter",
    name: "Recruiter",
    blurb: "Experience and impact first",
    color: "from-amber-400 to-orange-600",
    order: ["seasons", "numbers", "originals", "skills", "pilot", "bts"],
  },
  {
    id: "engineer",
    name: "Engineer",
    blurb: "Projects and stack first",
    color: "from-sky-400 to-indigo-600",
    order: ["originals", "skills", "seasons", "numbers", "pilot", "bts"],
  },
  {
    id: "browsing",
    name: "Just browsing",
    blurb: "The story first",
    color: "from-emerald-400 to-teal-700",
    order: ["pilot", "seasons", "originals", "bts", "numbers", "skills"],
  },
];

export const navSections = [
  { id: "seasons", label: "Seasons" },
  { id: "originals", label: "Originals" },
  { id: "skills", label: "Skills" },
  { id: "pilot", label: "About" },
  { id: "finale", label: "Contact" },
];
