# Vect — Autonomous Content Generation System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OPENCLAW AGENT ORCHESTRATOR                         │
│                     (GitHub Actions Cron)                              │
│                                                                       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Trend        │  │ Content      │  │ Distribution │                │
│  │ Detection    │──▶ Generation   │──▶ Engine       │                │
│  │ Agent        │  │ Agent        │  │              │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
│         │                │                   │                        │
│         ▼                ▼                   ▼                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                │
│  │ Signal       │  │ Content      │  │ Channel      │                │
│  │ Store        │  │ Archive      │  │ Adapters     │                │
│  │ (GitHub)     │  │ (GitHub)     │  │              │                │
│  └──────────────┘  └──────────────┘  └──────────────┘                │
└─────────────────────────────────────────────────────────────────────────┘
         │                │                   │
         ▼                ▼                   ▼
┌─────────────┐  ┌──────────────┐  ┌───────────────────┐
│ Gemini API  │  │ GitHub Repo  │  │ Distribution      │
│ (Free Tier) │  │ (Content     │  │                   │
│             │  │  Archive)    │  │ ┌───────────────┐ │
└─────────────┘  └──────────────┘  │ │ Buffer (3ch)  │ │
                        │          │ │ Typefully (X) │ │
                        ▼          │ │ Make.com      │ │
                 ┌──────────────┐  │ └───────────────┘ │
                 │ Vercel       │  └───────────────────┘
                 │ Auto-Deploy  │
                 │ (Blog)       │
                 └──────────────┘
```

## Component Architecture

### 1. Agent Orchestration Layer

The system uses GitHub Actions as the primary orchestrator, running scheduled cron jobs
that trigger the content generation pipeline.

```
GitHub Actions (Cron Schedule)
    │
    ├── Weekly Content Generation (Sunday 08:00 UTC)
    │   ├── Trend Detection Agent
    │   ├── Content Generation Agent (7 channels)
    │   └── Archive Commit Agent
    │
    ├── Blog Auto-Publish (on push to /content/blog/)
    │   └── Vercel Auto-Deploy
    │
    └── Distribution Trigger (Monday 09:00 UTC)
        └── Make.com Webhook → Buffer / Typefully
```

### 2. Agent Roles

| Agent | Role | Input | Output |
|-------|------|-------|--------|
| **Trend Scout** | Monitors Reddit, HN, X for emerging AI trust discourse | RSS feeds, Reddit API | Signal reports (JSON) |
| **Thesis Extractor** | Extracts structural insights from trend signals | Signal reports | Core thesis statements |
| **Contrarian Framer** | Generates counterintuitive perspectives | Thesis statements | Contrarian framings |
| **Content Generator** | Produces channel-specific content from framings | Framings + channel templates | 7 content outputs |
| **Voice Validator** | Ensures all content matches founder voice model | Raw content | Validated content |
| **Archive Manager** | Commits content to GitHub, triggers deploys | Validated content | Git commits |

### 3. Content Pipeline Flow

```
Trend Signals
    │
    ▼
┌─────────────────────┐
│ Signal Collection    │  ◄── Reddit API, HN RSS, X API
│ (trend_detector.js)  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Thesis Extraction   │  ◄── Gemini API
│                     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Contrarian Framing  │  ◄── Gemini API + Prompt Templates
│                     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Multi-Channel       │  ◄── 7 Channel Prompt Templates
│ Content Generation  │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Voice Validation    │  ◄── Founder Voice Model
│ & Quality Check     │
└─────────┬───────────┘
          │
          ▼
┌─────────────────────┐
│ Archive & Publish   │  ◄── Git Commit + Vercel Deploy
│                     │
└─────────────────────┘
```

### 4. Deployment Structure

| Component | Platform | Cost | Purpose |
|-----------|----------|------|---------|
| Agent Orchestrator | GitHub Actions | $0 | Cron scheduling, CI/CD |
| Content Generation | Gemini API (Free) | $0 | AI content generation |
| Content Archive | GitHub Repository | $0 | Version-controlled content store |
| Blog Hosting | Vercel (Free) | $0 | tryvect.com/blog auto-deploy |
| Keep-Alive | UptimeRobot (Free) | $0 | Render.com ping (if needed) |
| Workflow Automation | Make.com (Free) | $0 | Distribution triggers (~186 ops/mo) |
| Social Scheduling | Buffer (Free, 3ch) | $0 | LinkedIn, Instagram, Facebook |
| X Publishing | Typefully (Free) | $0 | Twitter/X thread scheduling |

**Total Monthly Cost: $0**

### 5. Make.com Operation Budget

```
Monthly Budget: 1000 operations (free tier)

Allocation:
├── Content Distribution Triggers:  4/week × 4 = 16 ops/mo
├── Blog Publish Webhooks:          1/week × 4 =  4 ops/mo
├── Outreach Triggers:              2/week × 4 =  8 ops/mo
├── Lead Capture Webhooks:          ~40 ops/mo (estimate)
├── Buffer Scheduling:              4/week × 4 = 16 ops/mo
├── Typefully Scheduling:           1/week × 4 =  4 ops/mo
├── Error Notifications:            ~10 ops/mo
└── Buffer:                         ~88 ops/mo
                                   ─────────────
Total:                              ~186 ops/mo ✓ (well under 1000)
```

### 6. UptimeRobot Configuration

```
Purpose: Keep Render.com services alive (free tier spins down after inactivity)

Configuration:
├── Monitor Type: HTTP(s)
├── URL: https://your-render-service.onrender.com/health
├── Monitoring Interval: 5 minutes
├── Alert Contacts: Email (optional)
└── Cost: $0 (free forever, unlimited monitors)

This replaces Make.com keep-alive pings, saving ~4320 ops/month.
```

## Failure Handling

### API Failure (Gemini)
```
1. GitHub Actions retries the job (max 3 attempts)
2. If all retries fail, the workflow creates a GitHub Issue tagged "content-generation-failure"
3. Previous week's content templates are used as fallback
4. Manual review is triggered via email notification
```

### Content Generation Failure
```
1. Output validation checks for minimum length, required sections
2. If validation fails, content is regenerated with adjusted parameters
3. After 3 failed generations, the channel is skipped for the week
4. A GitHub Issue is created for manual content creation
```

### Post Scheduling Failure
```
1. Make.com webhook failures trigger email alerts
2. Content remains in the archive for manual posting
3. Buffer/Typefully failures are logged in GitHub Actions
4. Retry logic runs on the next scheduled cycle
```

### Distribution Channel Failure Matrix

| Failure | Detection | Recovery | Escalation |
|---------|-----------|----------|------------|
| Gemini API down | HTTP 5xx | 3 retries, 60s backoff | GitHub Issue |
| Reddit API limit | HTTP 429 | Skip Reddit, continue others | Log warning |
| Buffer API error | Webhook fail | Manual post from archive | Email alert |
| Typefully error | API timeout | Queue for next cycle | Log warning |
| Git commit fail | Exit code ≠ 0 | Retry with force push | GitHub Issue |
| Vercel deploy fail | Build error | Rollback to previous | GitHub Issue |
