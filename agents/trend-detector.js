/**
 * Vect Trend Detection Engine
 *
 * Lightweight trend detection using free APIs to monitor discourse around
 * AI trust, provenance, fraud, verification, and institutional credibility.
 *
 * Sources:
 * - Reddit (r/SaaS, r/startups, r/MachineLearning, r/Artificial)
 * - Hacker News (front page + Ask HN)
 *
 * Usage:
 *   node trend-detector.js
 */

const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');

// ---------------------------------------------------------------------------
// Keywords for Signal Detection
// ---------------------------------------------------------------------------

const SIGNAL_KEYWORDS = [
  'ai trust', 'ai verification', 'ai provenance', 'deepfake',
  'misinformation', 'disinformation', 'content authenticity',
  'digital trust', 'verification system', 'institutional trust',
  'synthetic fraud', 'ai hallucination', 'fact checking', 'fact-checking',
  'content provenance', 'digital integrity', 'trust infrastructure',
  'credential verification', 'information integrity', 'truth',
  'authenticity', 'credibility', 'sovereign', 'sovereignty',
  'immutable', 'verifiable', 'tamper-proof', 'blockchain verification',
];

// ---------------------------------------------------------------------------
// Reddit Signal Collector
// ---------------------------------------------------------------------------

async function fetchRedditSignals() {
  const signals = [];
  const { subreddits, sortBy, limit } = config.trendSources.reddit;

  for (const subreddit of subreddits) {
    try {
      const url = `https://www.reddit.com/r/${subreddit}/${sortBy}.json?limit=${limit}`;
      const response = await fetch(url, {
        headers: { 'User-Agent': 'VectTrendDetector/1.0' },
      });

      if (!response.ok) {
        console.warn(`  ⚠ Reddit r/${subreddit} returned ${response.status}`);
        continue;
      }

      const data = await response.json();
      const posts = data?.data?.children || [];

      for (const post of posts) {
        const { title, selftext, score, num_comments, created_utc } = post.data;
        const combinedText = `${title} ${selftext}`.toLowerCase();

        const matchedKeywords = SIGNAL_KEYWORDS.filter(kw =>
          combinedText.includes(kw)
        );

        if (matchedKeywords.length > 0) {
          signals.push({
            source: 'reddit',
            subreddit: `r/${subreddit}`,
            title,
            excerpt: selftext?.substring(0, 200) || '',
            score,
            comments: num_comments,
            matchedKeywords,
            relevanceScore: matchedKeywords.length * score,
            timestamp: new Date(created_utc * 1000).toISOString(),
          });
        }
      }

      console.log(`  ✓ r/${subreddit}: ${posts.length} posts scanned, ${signals.length} signals found`);
    } catch (error) {
      console.warn(`  ✗ r/${subreddit} error: ${error.message}`);
    }
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Hacker News Signal Collector
// ---------------------------------------------------------------------------

async function fetchHNSignals() {
  const signals = [];
  const { endpoint, storyLimit } = config.trendSources.hackerNews;

  try {
    // Fetch top stories
    const topResponse = await fetch(`${endpoint}/topstories.json`);
    if (!topResponse.ok) {
      console.warn(`  ⚠ HN top stories returned ${topResponse.status}`);
      return signals;
    }

    const topIds = await topResponse.json();
    const storyIds = topIds.slice(0, storyLimit);

    // Fetch story details (batch)
    const stories = await Promise.all(
      storyIds.map(async (id) => {
        try {
          const res = await fetch(`${endpoint}/item/${id}.json`);
          return res.ok ? res.json() : null;
        } catch {
          return null;
        }
      })
    );

    for (const story of stories.filter(Boolean)) {
      const combinedText = `${story.title || ''} ${story.text || ''}`.toLowerCase();

      const matchedKeywords = SIGNAL_KEYWORDS.filter(kw =>
        combinedText.includes(kw)
      );

      if (matchedKeywords.length > 0) {
        signals.push({
          source: 'hackernews',
          title: story.title,
          excerpt: story.text?.substring(0, 200) || '',
          score: story.score || 0,
          comments: story.descendants || 0,
          matchedKeywords,
          relevanceScore: matchedKeywords.length * (story.score || 1),
          url: story.url || `https://news.ycombinator.com/item?id=${story.id}`,
          timestamp: new Date((story.time || 0) * 1000).toISOString(),
        });
      }
    }

    console.log(`  ✓ Hacker News: ${stories.length} stories scanned, ${signals.length} signals found`);
  } catch (error) {
    console.warn(`  ✗ HN error: ${error.message}`);
  }

  return signals;
}

// ---------------------------------------------------------------------------
// Signal Analyzer
// ---------------------------------------------------------------------------

function analyzeSignals(allSignals) {
  // Sort by relevance
  const sorted = allSignals.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Extract topic clusters
  const keywordFrequency = {};
  for (const signal of allSignals) {
    for (const kw of signal.matchedKeywords) {
      keywordFrequency[kw] = (keywordFrequency[kw] || 0) + 1;
    }
  }

  const topicClusters = Object.entries(keywordFrequency)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([keyword, count]) => ({
      keyword,
      frequency: count,
      status: count > 5 ? 'established' : count > 2 ? 'growing' : 'emerging',
    }));

  // Extract emotional triggers from titles
  const urgencyWords = ['crisis', 'threat', 'danger', 'risk', 'urgent', 'critical',
    'collapse', 'failure', 'broken', 'problem', 'concern', 'worried'];
  const emotionalSignals = allSignals.filter(s =>
    urgencyWords.some(w => s.title.toLowerCase().includes(w))
  );

  return {
    totalSignals: allSignals.length,
    topSignals: sorted.slice(0, 10),
    topicClusters,
    emotionalSignals: emotionalSignals.slice(0, 5),
    sourceSummary: {
      reddit: allSignals.filter(s => s.source === 'reddit').length,
      hackernews: allSignals.filter(s => s.source === 'hackernews').length,
    },
  };
}

// ---------------------------------------------------------------------------
// Contrarian Take Generator (via Gemini)
// ---------------------------------------------------------------------------

async function generateContrarianTakes(analysis) {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    console.log('  ⚠ No Gemini API key — skipping contrarian take generation');
    return null;
  }

  const promptTemplate = fs.readFileSync(
    path.join(__dirname, 'prompts', 'contrarian-framer.md'),
    'utf-8'
  );

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{
      parts: [{
        text: `${promptTemplate}\n\nTREND SIGNALS:\n${JSON.stringify(analysis, null, 2)}\n\nGenerate 3 contrarian takes based on these signals. Output as JSON.`
      }]
    }],
    generationConfig: {
      maxOutputTokens: 2048,
      temperature: 0.85,
    },
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) return null;

    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('\n🔍 Vect Trend Detection Engine\n');
  console.log('═══════════════════════════════════════════════════\n');

  // Collect signals
  console.log('📡 Collecting signals...\n');

  const [redditSignals, hnSignals] = await Promise.all([
    fetchRedditSignals(),
    fetchHNSignals(),
  ]);

  const allSignals = [...redditSignals, ...hnSignals];

  console.log(`\n📊 Total signals: ${allSignals.length}\n`);

  // Analyze signals
  console.log('🧠 Analyzing signals...\n');
  const analysis = analyzeSignals(allSignals);

  // Generate contrarian takes
  console.log('💡 Generating contrarian takes...\n');
  const contrarianTakes = await generateContrarianTakes(analysis);

  // Save results
  const repoRoot = path.resolve(__dirname, '..');
  const signalsDir = path.join(repoRoot, 'content', 'signals');
  if (!fs.existsSync(signalsDir)) {
    fs.mkdirSync(signalsDir, { recursive: true });
  }

  const date = new Date().toISOString().split('T')[0];

  const output = {
    date,
    analysis,
    contrarianTakes,
    rawSignalCount: allSignals.length,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(signalsDir, `${date}-trends.json`);
  fs.writeFileSync(filePath, JSON.stringify(output, null, 2), 'utf-8');

  console.log('═══════════════════════════════════════════════════');
  console.log(`\n✅ Trend analysis saved: ${filePath}`);
  console.log(`   Signals found: ${allSignals.length}`);
  console.log(`   Topic clusters: ${analysis.topicClusters.length}`);
  console.log(`   Emotional signals: ${analysis.emotionalSignals.length}\n`);
}

main().catch(error => {
  console.error(`\n💥 Fatal error: ${error.message}`);
  process.exit(1);
});
