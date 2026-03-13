# Automation Workflows

## End-to-End Workflow

### How GitHub → Render → Make.com → Buffer → Typefully Connect

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  GitHub       │     │  Gemini API  │     │  GitHub       │
│  Actions      │────▶│  (Generate)  │────▶│  Repo         │
│  (Cron)       │     │              │     │  (Archive)    │
└──────┬───────┘     └──────────────┘     └──────┬───────┘
       │                                         │
       │  Webhook trigger                        │ Auto-deploy
       ▼                                         ▼
┌──────────────┐                          ┌──────────────┐
│  Make.com     │                          │  Vercel       │
│  (Workflow)   │                          │  (Blog)       │
└──────┬───────┘                          └──────────────┘
       │
       ├──────────────┐──────────────┐
       ▼              ▼              ▼
┌──────────┐  ┌──────────┐  ┌──────────┐
│  Buffer   │  │ Typefully│  │ Outreach │
│  (3 ch)   │  │ (X/Twitter)│ │ Tools   │
└──────────┘  └──────────┘  └──────────┘
```

## Step-by-Step Workflow

### Step 1: Content Generation (GitHub Actions)

**Trigger:** Cron schedule (Sunday 08:00 UTC)

1. GitHub Actions workflow starts
2. Node.js script runs trend detection (Reddit API, RSS feeds)
3. Trend signals are passed to Gemini API
4. Gemini generates content for all 7 channels using prompt templates
5. Output validation checks content quality
6. Content is saved to `/content/{channel}/` directories
7. Blog markdown is saved to `/web/blog/posts/`
8. All content is committed and pushed to repository

### Step 2: Blog Auto-Deploy (Vercel)

**Trigger:** Push to `/web/blog/` or `/content/blog/` path

1. Vercel detects new commit on monitored branch
2. Static site build runs automatically
3. Blog post is live at tryvect.com/blog within ~60 seconds
4. No manual intervention required

### Step 3: Social Distribution (Make.com)

**Trigger:** GitHub Actions webhook after content generation

1. Make.com receives webhook with content payload
2. Scenario routes content to appropriate channels:

**Buffer Route (LinkedIn, Instagram, Facebook):**
```
Make.com Webhook
  → Parse JSON payload
  → Extract LinkedIn content → Buffer API → Schedule LinkedIn post
  → Extract Instagram content → Buffer API → Schedule Instagram post
```

**Typefully Route (X/Twitter):**
```
Make.com Webhook
  → Parse JSON payload
  → Extract X thread content → Typefully API → Schedule thread
```

**Outreach Route:**
```
Make.com Webhook
  → Parse JSON payload
  → Extract outreach templates → Store in Google Sheet / Notion
  → (Manual send via Apollo.io / Instantly.ai)
```

### Step 4: Reddit (Manual Post from Archive)

**CRITICAL: Reddit must NEVER auto-post or auto-reply.**

1. Content is generated and stored in `/content/reddit/`
2. Founder manually reviews and posts to r/SaaS
3. No automated Reddit interaction to avoid moderation flags

### Step 5: Community Responses (Manual)

1. Expert witness responses are generated and stored in `/content/community/`
2. Founder manually posts in relevant Slack/Discord communities
3. No automated community interaction

## Make.com Scenario Configuration

### Scenario 1: Content Distribution
```
Trigger: Webhook (Custom)
Module 1: JSON Parser — Parse incoming content payload
Module 2: Router
  ├── Route A: Buffer — Create Post (LinkedIn)
  ├── Route B: Buffer — Create Post (Instagram)
  └── Route C: Typefully — Create Draft (X Thread)
```

### Scenario 2: Lead Capture
```
Trigger: Webhook (Custom)
Module 1: JSON Parser — Parse lead data
Module 2: Google Sheets — Add Row (Lead tracking)
Module 3: (Optional) Email notification
```

### Scenario 3: Blog Notification
```
Trigger: Webhook (Custom)
Module 1: Parse blog metadata
Module 2: Buffer — Create Post (share blog link on LinkedIn)
```

## Buffer Configuration

```
Free Tier: 3 social channels, 10 scheduled posts per channel

Channel Allocation:
1. LinkedIn (company or personal page)
2. Instagram (business account)
3. Facebook (optional, or swap for another channel)

Posting Schedule:
- LinkedIn: Tuesday & Thursday, 09:00 AM EST
- Instagram: Wednesday & Friday, 12:00 PM EST
```

## Typefully Configuration

```
Free Tier: Unlimited drafts, basic scheduling

Usage:
- X/Twitter thread scheduling
- One thread per week (Wednesday, 10:00 AM EST)
- Draft review before auto-publish
```

## UptimeRobot Setup

```
1. Create free account at uptimerobot.com
2. Add new monitor:
   - Monitor Type: HTTP(s)
   - Friendly Name: "Vect Render Keep-Alive"
   - URL: https://your-service.onrender.com/health
   - Monitoring Interval: 5 minutes
3. Save — service stays alive 24/7 at $0 cost
```

## Weekly Automation Timeline

```
Sunday 08:00 UTC    │ GitHub Actions: Content generation for all 7 channels
Sunday 08:30 UTC    │ GitHub Actions: Commit content to archive
Sunday 08:31 UTC    │ Vercel: Auto-deploy blog post
Monday 09:00 UTC    │ Make.com: Distribute to Buffer & Typefully
Tuesday 13:00 UTC   │ Buffer: Auto-publish LinkedIn post
Tuesday (manual)    │ Founder: Post Reddit content from archive
Wednesday 14:00 UTC │ Typefully: Auto-publish X thread
Wednesday (manual)  │ Founder: Post community responses
Thursday 13:00 UTC  │ Buffer: Auto-publish LinkedIn (if 2nd post)
Friday 16:00 UTC    │ Buffer: Auto-publish Instagram post
Friday (manual)     │ Founder: Send outreach from templates
```
