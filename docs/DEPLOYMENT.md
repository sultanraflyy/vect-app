# Deployment Guide

## Overview

The Vect autonomous content system requires zero paid infrastructure.
All components run on free-tier services.

## Prerequisites

1. GitHub repository (this repo)
2. Gemini API key (free at ai.google.dev)
3. Vercel account (free tier)
4. Make.com account (free tier — 1000 ops/month)
5. Buffer account (free tier — 3 channels)
6. Typefully account (free tier)
7. UptimeRobot account (free forever)

## Step 1: GitHub Secrets

Add these secrets to your GitHub repository settings:

```
Settings → Secrets and variables → Actions → New repository secret
```

| Secret | Description |
|--------|-------------|
| `GEMINI_API_KEY` | Google Gemini API key (free at ai.google.dev) |
| `MAKECOM_WEBHOOK_URL` | Make.com webhook URL for distribution |
| `BUFFER_ACCESS_TOKEN` | Buffer API access token |
| `BUFFER_LINKEDIN_PROFILE_ID` | Buffer LinkedIn profile ID |
| `BUFFER_INSTAGRAM_PROFILE_ID` | Buffer Instagram profile ID |
| `TYPEFULLY_API_KEY` | Typefully API key |

## Step 2: Vercel Blog Deployment

1. Go to [vercel.com](https://vercel.com)
2. Create a new project
3. Import this repository (`sultanraflyy/vect-app`)
4. Set **Root Directory** to `web/blog`
5. Set **Framework Preset** to "Other"
6. Add custom domain: `tryvect.com/blog` (or configure as subdirectory)
7. Deploy

Vercel will auto-deploy whenever content is pushed to `web/blog/`.

## Step 3: UptimeRobot Setup

1. Create account at [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - **Monitor Type:** HTTP(s)
   - **Friendly Name:** Vect Render Keep-Alive
   - **URL:** `https://your-service.onrender.com/health`
   - **Monitoring Interval:** 5 minutes
3. Save

This keeps Render.com services alive without using Make.com operations.

## Step 4: Make.com Scenario Setup

### Scenario 1: Content Distribution

1. Create new scenario in Make.com
2. Add **Webhook** trigger (Custom Webhook)
3. Copy the webhook URL → save as `MAKECOM_WEBHOOK_URL` in GitHub secrets
4. Add **Router** module with 3 routes:

The webhook payload sent by the content engine has this structure:
```json
{
  "linkedin_content": "Generated LinkedIn post text",
  "instagram_content": "Generated Instagram caption",
  "x_thread_content": "Generated X thread (tweets separated by newlines)",
  "linkedin_profile_id": "Your Buffer LinkedIn profile ID",
  "instagram_profile_id": "Your Buffer Instagram profile ID",
  "typefully_api_key": "Your Typefully API key",
  "scheduled_time": "ISO 8601 timestamp for scheduling"
}
```

In Make.com, reference these values using `{{1.linkedin_content}}` etc.
(where `1` refers to the Webhook module number).

**Route A — Buffer (LinkedIn):**
```
Router → HTTP Request
  URL: https://api.bufferapp.com/1/updates/create.json
  Method: POST
  Body: {
    "text": "{{linkedin_content}}",
    "profile_ids": ["{{linkedin_profile_id}}"],
    "scheduled_at": "{{scheduled_time}}"
  }
```

**Route B — Buffer (Instagram):**
```
Router → HTTP Request
  URL: https://api.bufferapp.com/1/updates/create.json
  Method: POST
  Body: {
    "text": "{{instagram_content}}",
    "profile_ids": ["{{instagram_profile_id}}"],
    "scheduled_at": "{{scheduled_time}}"
  }
```

**Route C — Typefully (X Thread):**
```
Router → HTTP Request
  URL: https://api.typefully.com/v1/drafts/
  Method: POST
  Headers: { "X-API-KEY": "{{typefully_api_key}}" }
  Body: {
    "content": "{{x_thread_content}}",
    "schedule-date": "{{scheduled_time}}"
  }
```

### Scenario 2: Lead Capture (Optional)

1. Add **Webhook** trigger
2. Add **Google Sheets** module → Add Row
3. Configure columns: Name, Source, Date, Content, Status

## Step 5: Buffer Configuration

1. Create account at [buffer.com](https://buffer.com)
2. Connect 3 channels:
   - LinkedIn (personal or company page)
   - Instagram (business account)
   - (Optional 3rd channel)
3. Get API access token from Buffer developer portal
4. Note profile IDs for each connected channel

## Step 6: Typefully Configuration

1. Create account at [typefully.com](https://typefully.com)
2. Connect your X/Twitter account
3. Go to Settings → API → Generate API key
4. Save the API key as `TYPEFULLY_API_KEY` in GitHub secrets

## Step 7: Enable GitHub Actions

The workflows are already configured in `.github/workflows/`:

- `content-generation.yml` — Weekly content generation (Sunday 08:00 UTC)
- `blog-deploy.yml` — Blog post validation on push

To trigger manually:
```
Actions → Content Generation → Run workflow
```

## Step 8: Test the System

1. Go to GitHub Actions
2. Select "Content Generation"
3. Click "Run workflow"
4. Choose a specific channel (e.g., "blog") for testing
5. Verify content appears in `content/` and `web/blog/posts/`

## Monthly Cost Breakdown

| Service | Tier | Monthly Cost |
|---------|------|-------------|
| GitHub | Free | $0 |
| GitHub Actions | Free (2000 min/mo) | $0 |
| Gemini API | Free tier | $0 |
| Vercel | Hobby (free) | $0 |
| Make.com | Free (1000 ops/mo) | $0 |
| Buffer | Free (3 channels) | $0 |
| Typefully | Free | $0 |
| UptimeRobot | Free (unlimited) | $0 |
| **Total** | | **$0** |

## Estimated Make.com Usage

| Workflow | Frequency | Ops/Month |
|----------|-----------|-----------|
| Content distribution | 4×/month | 16 |
| Blog publish hooks | 4×/month | 4 |
| Outreach triggers | 8×/month | 8 |
| Lead capture | ~40×/month | 40 |
| Buffer scheduling | 16×/month | 16 |
| Typefully scheduling | 4×/month | 4 |
| Error notifications | ~10×/month | 10 |
| Buffer | | 88 |
| **Total** | | **~186** |

Well under the 1000 operation free-tier limit.
