# Attribution UTM Conventions

How inbound tracked links work on Accelerate Health. Visit logging (`attribution_visits`) is separate from intake click logging (`link_clicks`).

## Two systems (no linkage)

| System | Trigger | Table | Purpose |
|--------|---------|-------|---------|
| Visit attribution | User hits `/go?utm_*` | `attribution_visits` | Log email/social/ad landings |
| Intake attribution | User clicks Learn More → `/r/{clickId}` | `link_clicks` | Log Bask intake handoff |

These tables are not joined. Visit UTMs are not passed to Learn More CTAs.

## Tracked link format

Use `/go` for every outbound tracked link (email, social bio, SMS, partner):

```
https://acceleratehealth.co/go?utm_source=email&utm_medium=winback&utm_campaign=patient-reengage-2026&utm_content=email-1
```

Optional landing path (UTMs stripped from visible URL after redirect):

```
https://acceleratehealth.co/go?utm_source=email&utm_medium=winback&utm_campaign=patient-reengage-2026&utm_content=email-1&dest=/blog/complete-guide-erectile-dysfunction
```

## UTM parameters

| Param | Required | Email example | Other channels |
|-------|----------|---------------|----------------|
| `utm_source` | Yes* | `email` | `AFFILIATE`, `tiktok`, `reddit`, `partner` |
| `utm_medium` | Recommended | `winback` | `tiktok`, `reddit`, `newsletter` |
| `utm_campaign` | Yes* | `patient-reengage-2026` | `bf-hezkue-meme`, `bf-hezkue-landing` |
| `utm_content` | Recommended | `email-1`, `email-saturday` | `dm_sweep`, `bio-link`, `reel-12` |
| `utm_term` | Optional | A/B cohort, subject variant | handle or keyword |

\* At least one of `utm_source` or `utm_campaign` is required. `/go` returns `400` without either.

## What `/go` does

1. Validates UTMs
2. Inserts one row into `attribution_visits` (every click = one row)
3. Redirects `302` to `dest` (default `/`) with a clean URL (no UTMs in the address bar)

## Examples by channel

**Email win-back**

```
/go?utm_source=email&utm_medium=winback&utm_campaign=patient-reengage-2026&utm_content=email-1
```

**TikTok bio**

```
/go?utm_source=AFFILIATE&utm_medium=tiktok&utm_campaign=bf-hezkue-meme&utm_content=link-in-bio&utm_term=viral_ed
```

**Reddit post**

```
/go?utm_source=AFFILIATE&utm_medium=reddit&utm_campaign=bf-hezkue-gymbro&utm_content=spray-vs-tablet-post
```

**Landing CTA simulation (browser tests)**

```
/go?utm_source=AFFILIATE&utm_medium=landing&utm_campaign=bf-hezkue-landing&utm_content=hero
```

## Reporting (visits only)

```sql
-- Email campaign clicks
SELECT count(*) FROM attribution_visits
WHERE utm_source = 'email' AND utm_campaign = 'patient-reengage-2026';

-- Per creative
SELECT utm_content, count(*) FROM attribution_visits
WHERE utm_campaign = 'patient-reengage-2026'
GROUP BY utm_content;

-- Daily volume
SELECT date(visited_at) AS day, count(*) FROM attribution_visits
GROUP BY day ORDER BY day;
```

## Intake attribution (unchanged)

Learn More buttons still mint `/r/{clickId}` and write `link_clicks` with existing UTM defaults (`AFFILIATE` / `landing` / `bf-hezkue-landing` unless overridden by homepage `sessionStorage`).

Bask webhooks resolve conversions via `click_id` in `link_clicks`, not via `attribution_visits`.
