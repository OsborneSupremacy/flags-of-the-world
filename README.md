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
| `.github/workflows/` | `ci.yml` checks pull requests; `deploy.yml` deploys `main` |

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

## Infrastructure

Terraform in `iac/terraform/` follows the conventions of `ses-ui`. It uses the `bro-tfstate` S3 backend with key `flags-of-the-world` and S3-native locking, runs in `us-east-1`, and sets no profile in the provider. It reads the `osbornesupremacy.com` hosted zone from the landing zone's remote state.

It creates:

- **S3 bucket:** private, in the account-regional namespace, with all public access blocked and SSE-S3 encryption. It has no website hosting. The bucket policy lets only this distribution read it, through Origin Access Control.
- **CloudFront distribution:**
  - Uses `PriceClass_100` and HTTP/2 + HTTP/3, and redirects HTTP to HTTPS.
  - Hashed assets use `CachingOptimized`; `/index.html` uses `CachingDisabled`.
  - Sends security headers (HSTS, `nosniff`, `no-referrer`, frame `DENY`) and a strict CSP.
  - Maps 403 and 404 to `/index.html` as a safety net.
- **Custom domain** (`flags.osbornesupremacy.com`, set by `var.domain_name`): an ACM certificate validated by DNS, plus Route 53 A/AAAA alias records. Set `domain_name = null` to use the `*.cloudfront.net` URL instead.

```bash
export AWS_PROFILE=ben
terraform -chdir=iac/terraform init
terraform -chdir=iac/terraform plan
terraform -chdir=iac/terraform apply
```

Outputs: `bucket_name`, `distribution_id`, `site_url`.

## Deploy

### From GitHub Actions

`.github/workflows/deploy.yml` deploys on every push to `main` that touches `app/`, `scripts/` or the workflow itself, and on demand from the Actions tab (**Run workflow**, on `main`). It runs lint, tests and the build, then runs `scripts/deploy.sh` on that build.

As in `ses-ui`, it assumes the landing zone's `github-actions` role (`ahzborn-aws`) through GitHub OIDC. It finds the distribution by its alias, and builds the bucket name from the caller's account id the way `locals.tf` does. The only repository setting is the `AWS_ROLE_ARN` secret, which holds that role's ARN:

```bash
gh secret set AWS_ROLE_ARN --body "arn:aws:iam::<account-id>:role/github-actions"
```

That role trusts every branch of every repository under the OsborneSupremacy GitHub account, so the deploy job itself refuses to run anywhere but `main`.

Pull requests get `.github/workflows/ci.yml` instead: lint, test and build, with no AWS access.

### Locally

```bash
AWS_PROFILE=ben ./scripts/deploy.sh
```

The script reads the bucket and distribution from `terraform output`, builds with `npm ci && npm run build`, then:

1. Uploads hashed files in `assets/` with `Cache-Control: public, max-age=31536000, immutable`.
2. Uploads any other unhashed files (`favicon.svg`) with `no-cache`.
3. Uploads `index.html` last with `no-cache`. This is the moment the new build goes live.
4. Deletes files the new build no longer uses (`sync --delete --size-only`, so nothing is uploaded a second time).
5. Invalidates `/index.html` and `/`, then prints the site URL.

`BUCKET`, `DISTRIBUTION_ID` and `SITE_URL`, when set, take the place of the Terraform outputs, and `SKIP_BUILD=1` publishes the existing `app/dist`. The workflow uses both.

Live at https://flags.osbornesupremacy.com. It makes requests only to its own host.

