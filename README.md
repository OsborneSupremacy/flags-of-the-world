# Flags of the World

An ad-free flashcard app for learning every country's flag. It's a static React + Vite single-page app served from a private S3 bucket behind CloudFront. It makes no runtime network calls to anyone else: no analytics, no ads, no third-party scripts, and every flag is bundled.

## What it does

- **Four modes.**
  - *Flip cards:* see the flag, flip it, then grade yourself.
  - *Multiple choice:* four options, with the wrong answers drawn from the same region. A reverse option shows the name and asks for the flag.
  - *Type it:* forgiving about case, accents, punctuation, aliases and one typo.
  - *Look-alikes:* drills groups of easily confused flags, then shows the group side by side.
- **Filters.** Every mode can be limited to a region and set to 10, 20 or all flags. The default set is the 193 UN members plus Vatican City and Palestine; a toggle adds territories.
- **Profiles and spaced repetition.** Each family member has a profile (name + emoji) with a five-box Leitner deck. Sessions favour the boxes for the flags they know least.
- **Progress screen.** Shows mastered flags per region, the trickiest flags and the current daily streak.
- **Backup.** Everything is stored in `localStorage` under `flags:v1`. **Save backup** on the progress screen writes every player to a JSON file, and **Load backup** merges a file back in, matching players by id.

## Layout

| Path | What it is |
| --- | --- |
| `app/` | Vite + React + TypeScript SPA |
| `app/scripts/gen-countries.ts` | Regenerates `app/src/data/countries.json` from `world-countries` |
| `app/src/data/aliasOverrides.ts` | Hand-curated names people actually type (Burma, Czech Republic, Holland…) |
| `app/src/data/lookalikes.ts` | Groups of easily confused flags for the look-alikes drill |
| `app/src/lib/` | Pure, tested logic: answer matching, distractors, Leitner, storage, stats, backup |
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
