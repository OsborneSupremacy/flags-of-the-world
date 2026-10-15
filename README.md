# Flags of the World

An ad-free flashcard app for learning every country's flag. It's a static React + Vite single-page app served from a private S3 bucket behind CloudFront. It makes no runtime network calls to anyone else: no analytics, no ads, no third-party scripts, and every flag is bundled.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | Vite + React + TypeScript SPA |
| `app/scripts/gen-countries.ts` | Regenerates `app/src/data/countries.json` from `world-countries` |
| `app/src/data/aliasOverrides.ts` | Hand-curated names people actually type (Burma, Czech Republic, Holland…) |
| `iac/terraform/` | S3 + CloudFront + ACM + Route 53. Backend key `flags-of-the-world` |
| `scripts/deploy.sh` | Build, upload, invalidate |

## Local development

Requires Node 24 or later. The country generator relies on Node's built-in TypeScript support.

```bash
cd app
npm ci
npm run dev        # http://localhost:5173
npm test
npm run lint
npm run build
```

The dev server sends the same Content-Security-Policy as CloudFront, so a violation shows up locally first.

### Country data

`app/src/data/countries.json` is generated and committed. After upgrading `world-countries`, regenerate it and review the diff:

```bash
cd app && npm run gen:countries
```

Name and alias fixes go in `app/src/data/aliasOverrides.ts`, never in the JSON.
