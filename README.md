# Burhanuddin Chitalwala — The Series

A portfolio styled like a streaming series: opening titles, a "Who's watching?" screen, a hero banner, jobs as **Seasons**, projects as **Originals**, a ranked impact row, skills by genre, behind-the-scenes photos and a "To be continued…" finale.

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
| Jobs (each job is a season; each point an episode) | `seasons` |
| Projects (posters and the detail overlay) | `originals` |
| Ranked impact numbers | `topNumbers` |
| Skills | `skillGenres` |
| Photos | `behindTheScenes` |
| ▶ Play Intro slides | `introSlides` |
| "Who's watching?" profiles and the section order for each | `viewerProfiles` |

**Resume:** replace `public/docs/resume.pdf`. **Portrait:** replace `public/img/burhanuddin-portrait.jpg`.

## Code layout

```
app/
  page.js                  ← renders the series
  _series/
    Series.jsx             ← stages (opening → profiles → home) and overlays
    smoothScroll.jsx       ← Lenis smooth scroll and scroll locking
    fx.jsx                 ← reveals, magnetic buttons, 3D tilt, particles, cursor ring
    components/            ← one file per section or overlay
  admin/                   ← password-protected document dashboard
```

The opening titles play once per browser session; use "Replay opening titles" in the footer to see them again. Animations are reduced for visitors who turn on reduced motion.
