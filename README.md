# Burhanuddin Chitalwala — Portfolio

A cinematic, streaming-inspired portfolio: an animated intro, a "What brings you here?" screen that reorders sections, a hero banner, experience, project cards, a ranked impact row, skills, photos from outside work and a contact section.

Built with Next.js (App Router), Tailwind CSS, Framer Motion and Lenis.

## Run it locally

```bash
npm install
npm run dev
```

Open http://localhost:3000. The admin dashboard is still at `/admin`.

## Updating content

All homepage content lives in **`app/data/siteData.js`**, taken from `public/docs/resume.pdf`.

| To change… | Edit |
| --- | --- |
| Name, logline, summary, email, social links | `profile` |
| Education | `education` |
| Jobs and their highlights | `experience` |
| Projects (cards and the detail overlay) | `projects` |
| Ranked impact numbers | `impactNumbers` |
| Skills | `skillGroups` |
| Photos | `beyondWork` |
| Quick Intro slides | `introSlides` |
| Visitor types and the section order for each | `visitorTypes` |

**Resume:** replace `public/docs/resume.pdf`. **Portrait:** replace `public/img/burhanuddin-portrait.jpg`.

## Code layout

```
app/
  page.js                  ← renders the portfolio
  _portfolio/
    Portfolio.jsx          ← stages (intro → welcome → home) and overlays
    smoothScroll.jsx       ← Lenis smooth scroll and scroll locking
    fx.jsx                 ← reveals, magnetic buttons, 3D tilt, particles, cursor ring
    components/            ← one file per section or overlay
  admin/                   ← password-protected document dashboard
```

The intro plays once per browser session; use "Replay intro" in the footer to see it again. Animations are reduced for visitors who turn on reduced motion.
