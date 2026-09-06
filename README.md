# OnlyBrains 4D

Cinematic OnlyBrains site: interactive 4D neural field, digital-brain Lucien, course lab, 3D walkthrough, holotimeline.

## Deploy on Vercel

1. Import this repo in Vercel (Framework Preset: **Other**).
2. Build command: `npm run build`
3. Node.js 20+

### Environment variables

| Name | Required | What it does |
|---|---|---|
| `XAI_API_KEY` | for course generation | xAI / Grok API |
| `DATABASE_URL` | for saved courses + auth | Neon Postgres |
| `BETTER_AUTH_SECRET` | with database | session signing |
| `BETTER_AUTH_URL` | with database | e.g. `https://your-app.vercel.app` |
| `VITE_AUTH_ENABLED` | optional | set `true` to turn auth on |

Without `DATABASE_URL`, the site still deploys. Sign-in and saved courses need Neon.

## Local

```bash
npm install
npm run dev
```
