/**
 * Vect Content Engine Configuration
 *
 * Central configuration for the autonomous content generation system.
 * All values can be overridden via environment variables.
 */

const config = {
  // Gemini API Configuration (Free Tier)
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || '',
    model: 'gemini-1.5-flash-latest',
    maxOutputTokens: 2048,
    temperature: 0.8,
    topP: 0.95,
  },

  // Content Generation Schedule
  schedule: {
    // When to generate content (cron expressions, UTC)
    contentGeneration: '0 8 * * 0',  // Sunday 08:00 UTC
    distribution: '0 9 * * 1',       // Monday 09:00 UTC
  },

  // Channel Configuration
  channels: {
    reddit: {
      enabled: true,
      autoPost: false,  // CRITICAL: Never auto-post to Reddit
      subreddit: 'SaaS',
      maxWordCount: 400,
      minWordCount: 200,
    },
    linkedin: {
      enabled: true,
      autoPost: true,   // Via Buffer
      maxWordCount: 300,
      minWordCount: 150,
    },
    'x-thread': {
      enabled: true,
      autoPost: true,   // Via Typefully
      tweetCount: 7,
      maxTweetLength: 280,
    },
    instagram: {
      enabled: true,
      autoPost: true,   // Via Buffer
      maxWordCount: 250,
      minWordCount: 150,
    },
    outreach: {
      enabled: true,
      autoPost: false,  // Manual send via Apollo.io / Instantly.ai
      coldEmailMaxWords: 120,
      coldEmailMinWords: 80,
      linkedinDmMaxWords: 80,
      linkedinDmMinWords: 50,
    },
    community: {
      enabled: true,
      autoPost: false,  // Manual posting in communities
      responseCount: 3,
      maxWordCount: 200,
      minWordCount: 100,
    },
    blog: {
      enabled: true,
      autoPost: true,   // Via Git commit → Vercel deploy
      targetWordCount: 300,
      blogPath: 'web/blog/posts',
      blogUrl: 'https://tryvect.com/blog',
    },
  },

  // Intellectual Themes (rotated weekly)
  themes: [
    'The Sovereignty Gap',
    'The Provenance Crisis',
    'Institutional Credibility Collapse',
    'Security vs Certainty',
    'Integrity as Infrastructure',
    'Verification as a Luxury Signal',
  ],

  // Trend Detection Sources
  trendSources: {
    reddit: {
      subreddits: ['SaaS', 'startups', 'MachineLearning', 'Artificial'],
      sortBy: 'hot',
      limit: 25,
    },
    hackerNews: {
      endpoint: 'https://hacker-news.firebaseio.com/v0',
      storyLimit: 30,
    },
  },

  // Content Archive Paths (relative to repo root)
  archivePaths: {
    reddit: 'content/reddit',
    linkedin: 'content/linkedin',
    'x-thread': 'content/x-threads',
    instagram: 'content/instagram',
    outreach: 'content/outreach',
    community: 'content/community',
    blog: 'content/blog',
    signals: 'content/signals',
  },

  // Voice Model Parameters
  voiceModel: {
    bannedWords: [
      'revolutionary', 'game-changing', 'disrupting', 'disruptive',
      'move fast', '10x', 'unicorn', 'best-in-class', 'cutting-edge',
      'state-of-the-art', 'hack', 'viral', 'funnel', 'before it\'s too late',
      'don\'t miss out', 'excited to announce', 'thrilled to share',
      'game changer', 'next-gen', 'bleeding edge', 'paradigm shift',
      'synergy', 'leverage', 'circle back', 'low-hanging fruit',
    ],
    maxExclamationMarks: 0,
    maxEmojis: 0,
  },

  // Weekly Content Schedule
  weeklySchedule: {
    sunday: ['generate-all-content'],
    monday: ['distribute-to-buffer', 'distribute-to-typefully'],
    tuesday: ['linkedin-post-1', 'reddit-manual-post'],
    wednesday: ['x-thread-publish', 'community-manual-post'],
    thursday: ['linkedin-post-2'],
    friday: ['instagram-post', 'outreach-manual-send'],
    saturday: [],
  },

  // Make.com Configuration
  makecom: {
    webhookUrl: process.env.MAKECOM_WEBHOOK_URL || '',
    monthlyBudget: 1000,
    estimatedMonthlyUsage: 186,
  },

  // Distribution Endpoints
  distribution: {
    buffer: {
      accessToken: process.env.BUFFER_ACCESS_TOKEN || '',
      profileIds: {
        linkedin: process.env.BUFFER_LINKEDIN_PROFILE_ID || '',
        instagram: process.env.BUFFER_INSTAGRAM_PROFILE_ID || '',
      },
    },
    typefully: {
      apiKey: process.env.TYPEFULLY_API_KEY || '',
    },
  },
};

module.exports = config;
