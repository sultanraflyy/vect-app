# Agent Prompt Templates

This directory contains structured prompt templates for each content channel
and agent role in the Vect autonomous content system.

## Prompt Files

| File | Purpose |
|------|---------|
| `reddit.md` | r/SaaS discussion post generation |
| `linkedin.md` | Thought leadership post generation |
| `x-thread.md` | 7-tweet contrarian thread generation |
| `instagram.md` | Visual narrative post generation |
| `outreach.md` | Cold email + LinkedIn DM generation |
| `community.md` | Expert witness response generation |
| `blog.md` | SEO micro-blog article generation |
| `trend-detection.md` | Trend signal extraction |
| `contrarian-framer.md` | Contrarian perspective generation |
| `voice-model.md` | Founder voice consistency model |

## Usage

Each prompt template contains:
1. **System prompt** — Sets the agent's role and constraints
2. **User prompt template** — Dynamic input with placeholders
3. **Output format** — Expected structure of the response
4. **Validation rules** — Quality checks for the output
