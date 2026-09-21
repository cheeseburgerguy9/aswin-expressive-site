# Aswin — Material 3 Expressive Personal Site

A lightweight, responsive personal website for **Aswin A.S. Kurup**, designed around the Material 3 Expressive ideas of adaptive layouts, expressive shapes, meaningful motion, rich color, and clear hierarchy.

## Included

- Responsive desktop + mobile layout
- Light + dark mode with saved preference
- Material-style expressive organic shapes and spring-like transitions
- Home, About and Socials routes
- Main-page Telegram channel pill
- Socials page with X, Instagram, Telegram account, XDA and GitHub
- Full supplied Android/medicine story on the About page
- Reserved Self Hosted card
- Optional Worker-backed password gate for the future private area
- Empty self-hosted project API for now
- Reduced-motion support
- No frontend framework or runtime dependency
- Cloudflare Workers Static Assets deployment

## Local development

```bash
npm install
npm run dev
```

Then open the local URL printed by Wrangler.

## Deploy

```bash
npm run deploy
```

Cloudflare Workers Static Assets deploys the `public/` directory together with the Worker. See the official docs:
https://developers.cloudflare.com/workers/static-assets/

## Private area secret

When you are ready to activate the private section, set the Worker secret:

```bash
npx wrangler secret put SELF_HOSTED_PASSWORD
```

The secret is never bundled into the frontend. The Worker creates a short-lived HttpOnly session cookie after successful authentication.

The project endpoint is intentionally empty right now:

`GET /api/self-hosted/projects` → `{ "ok": true, "projects": [] }`

Add the project objects later in `src/index.js`, or move them to D1/KV/R2 when the private area grows.

## Quick Deploy button

After this project is pushed to a **public GitHub repository**, replace `YOUR_GITHUB_REPO_URL` below with the repository URL in your README:

```md
[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=YOUR_GITHUB_REPO_URL)
```

Cloudflare's Deploy to Cloudflare button can clone a public GitHub/GitLab repository, configure the Worker and deploy it to the user's account.
