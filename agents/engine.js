/**
 * Vect Content Generation Engine
 */

const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');

// ---------------------------------------------------------------------------
// Gemini API Client with JSON mode
// ---------------------------------------------------------------------------

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) throw new Error('GEMINI_API_KEY environment variable is not set');

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
    generationConfig: {
      maxOutputTokens: config.gemini.maxOutputTokens,
      temperature: config.gemini.temperature,
      topP: config.gemini.topP,
      responseMimeType: 'application/json', // Force JSON output
    },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error (${response.status}): ${errorText}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Empty response from Gemini API');

  return text;
}

// ---------------------------------------------------------------------------
// Tools
// ---------------------------------------------------------------------------

function loadPromptTemplate(channel) {
  return fs.readFileSync(path.join(__dirname, 'prompts', `${channel}.md`), 'utf-8');
}

function loadVoiceModel() {
  return fs.readFileSync(path.join(__dirname, 'prompts', 'voice-model.md'), 'utf-8');
}

function getWeeklyTheme() {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNumber = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return config.themes[weekNumber % config.themes.length];
}

// ---------------------------------------------------------------------------
// Channel Generators with explicit JSON schemas
// ---------------------------------------------------------------------------

async function generateReddit(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('reddit')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "title": "Post title",
  "body": "Full post body text",
  "closing_question": "The final open-ended question",
  "suggested_flair": "Discussion",
  "target_subreddit": "r/SaaS"
}`;
  
  const content = await callGemini(sys, usr);
  return { channel: 'reddit', content, theme };
}

async function generateLinkedIn(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('linkedin')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "post_body": "Full LinkedIn post with line breaks",
  "hashtags": ["#AITrust", "#Provenance", "#DigitalIntegrity"],
  "hook_line": "First line of the post (the hook)",
  "estimated_read_time": "1 min"
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'linkedin', content, theme };
}

async function generateXThread(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('x-thread')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "tweets": [
    { "number": 1, "text": "Tweet text", "type": "hook" },
    { "number": 2, "text": "Tweet text", "type": "argument" },
    { "number": 3, "text": "Tweet text", "type": "argument" },
    { "number": 4, "text": "Tweet text", "type": "insight" },
    { "number": 5, "text": "Tweet text", "type": "insight" },
    { "number": 6, "text": "Tweet text", "type": "reframe" },
    { "number": 7, "text": "Tweet text", "type": "closing" }
  ],
  "hashtags": ["#AIProvenance", "#DigitalTrust"],
  "thread_hook_summary": "One-line summary of the thread thesis"
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'x-thread', content, theme };
}

async function generateInstagram(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('instagram')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "caption": "Full Instagram caption text",
  "hashtags": ["#DigitalTrust", "#Provenance", "#AIIntegrity"],
  "visual_concept": "Description of recommended visual/graphic",
  "hook_line": "First line of the caption",
  "word_count": 200
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'instagram', content, theme };
}

async function generateOutreach(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('outreach')}

THEME: ${theme}

Return ONLY valid JSON with this exact schema:
{
  "cold_email": {
    "subject_line": "Subject text",
    "body": "Email body with [NAME], [COMPANY], [OBSERVATION] placeholders",
    "word_count": 100
  },
  "linkedin_dm": {
    "message": "DM text with [NAME], [COMPANY], [OBSERVATION] placeholders",
    "word_count": 65
  }
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'outreach', content, theme };
}

async function generateCommunity(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('community')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "responses": [
    {
      "question": "Realistic community question",
      "answer": "Expert witness response text",
      "community_context": "Slack/Discord channel type",
      "expertise_signal": "What authority this demonstrates"
    }
  ]
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'community', content, theme };
}

async function generateBlog(theme, trendSignals) {
  const sys = loadVoiceModel();
  const usr = `${loadPromptTemplate('blog')}

THEME: ${theme}
TREND: ${trendSignals || 'None'}

Return ONLY valid JSON with this exact schema:
{
  "title": "Article title (H1)",
  "slug": "url-friendly-slug",
  "meta_description": "150-160 character meta description",
  "content_markdown": "Full article in markdown format",
  "target_keyword": "primary keyword",
  "secondary_keywords": ["keyword1", "keyword2"],
  "word_count": 300,
  "estimated_read_time": "2 min",
  "published_date": "YYYY-MM-DD"
}`;

  const content = await callGemini(sys, usr);
  return { channel: 'blog', content, theme };
}

// ---------------------------------------------------------------------------
// Orchestrator
// ---------------------------------------------------------------------------

const CHANNEL_GENERATORS = {
  reddit: generateReddit,
  linkedin: generateLinkedIn,
  'x-thread': generateXThread,
  instagram: generateInstagram,
  outreach: generateOutreach,
  community: generateCommunity,
  blog: generateBlog,
};

function writeSummary(results, errors, theme) {
  const repoRoot = path.resolve(__dirname, '..');
  const date = new Date().toISOString().split('T')[0];
  const summaryDir = path.join(repoRoot, 'content', 'signals');
  
  if (!fs.existsSync(summaryDir)) fs.mkdirSync(summaryDir, { recursive: true });

  const summary = {
    date, theme,
    generated: results.map(r => r.channel),
    failed: errors.map(e => e.channel),
    errors, timestamp: new Date().toISOString()
  };
  fs.writeFileSync(path.join(summaryDir, `${date}-summary.json`), JSON.stringify(summary, null, 2), 'utf-8');

  // --- MAKE.COM PAYLOAD ---
  const makecomPayload = {
    linkedin_ready: false, 
    twitter_ready: false,
    instagram_ready: false, 
    outreach_ready: false
  };

  console.log('\n🔍 Processing results for Make.com payload:\n');

  results.forEach(result => {
    const rawContent = result.content || '';
    
    console.log(`  Channel: ${result.channel}`);
    console.log(`  Raw length: ${rawContent.length} chars`);
    
    // Since we forced JSON mode, try direct parse first
    let parsed = null;
    try {
      parsed = JSON.parse(rawContent);
      console.log(`  ✅ JSON parsed successfully`);
    } catch (parseErr) {
      console.log(`  ❌ JSON parse failed: ${parseErr.message}`);
      console.log(`  Raw content preview: ${rawContent.substring(0, 200)}...`);
    }

    // Populate Make.com payload with clean data
    if (result.channel === 'linkedin') {
      if (parsed && parsed.post_body) {
        makecomPayload.linkedin_text = parsed.post_body;
        makecomPayload.linkedin_ready = true;
        console.log(`  ✅ LinkedIn: post_body extracted (${parsed.post_body.length} chars)`);
      } else {
        console.log(`  ❌ LinkedIn: No post_body field found`);
        console.log(`  Available fields: ${Object.keys(parsed || {}).join(', ')}`);
      }
    }

    if (result.channel === 'x-thread') {
      if (parsed && Array.isArray(parsed.tweets)) {
        makecomPayload.twitter_text = parsed.tweets
          .map(t => (typeof t === 'string' ? t : t.text || ''))
          .filter(Boolean)
          .join('\n\n');
        makecomPayload.twitter_ready = true;
        console.log(`  ✅ Twitter: ${parsed.tweets.length} tweets extracted`);
      } else {
        console.log(`  ❌ Twitter: No tweets array found`);
      }
    }

    if (result.channel === 'instagram') {
      if (parsed && parsed.caption) {
        makecomPayload.instagram_text = parsed.caption;
        makecomPayload.instagram_ready = true;
        console.log(`  ✅ Instagram: caption extracted (${parsed.caption.length} chars)`);
      } else {
        console.log(`  ❌ Instagram: No caption field found`);
      }
    }

    if (result.channel === 'outreach') {
      if (parsed && parsed.cold_email && parsed.cold_email.body) {
        makecomPayload.outreach_body = parsed.cold_email.body;
        makecomPayload.outreach_subject = parsed.cold_email.subject_line || '';
        makecomPayload.outreach_ready = true;
        console.log(`  ✅ Outreach: cold_email extracted`);
      } else {
        console.log(`  ❌ Outreach: No cold_email.body found`);
      }
    }
    
    console.log('');
  });

  const payloadPath = path.join(repoRoot, 'content', 'latest-payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(makecomPayload, null, 2), 'utf-8');
  
  // Validation output
  const readyCount = Object.values(makecomPayload).filter(v => v === true).length;
  console.log(`\n  ✓ Make.com payload saved: ${payloadPath}`);
  console.log(`    Ready channels: ${readyCount}/4\n`);
  
  if (readyCount === 0) {
    console.warn(`    ⚠️  WARNING: No channels marked as ready!`);
    console.warn(`    This means either:`);
    console.warn(`    1. Gemini API is not returning valid JSON`);
    console.warn(`    2. JSON schema doesn't match expected fields`);
    console.warn(`    3. No content was generated at all\n`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const chIdx = args.indexOf('--channel');
  const targetChannel = chIdx >= 0 ? args[chIdx + 1] : null;

  const results = [];
  const errors = [];
  const theme = getWeeklyTheme();

  console.log(`\n📝 Vect Content Engine`);
  console.log(`Theme: ${theme}\n`);

  try {
    if (targetChannel) {
      console.log(`Generating ${targetChannel}...`);
      results.push(await CHANNEL_GENERATORS[targetChannel](theme, null));
    } else {
      for (const [ch, generator] of Object.entries(CHANNEL_GENERATORS)) {
        console.log(`Generating ${ch}...`);
        try { 
          results.push(await generator(theme, null)); 
          console.log(`  ✅ ${ch} generated`);
        } 
        catch (e) { 
          errors.push({ channel: ch, error: e.message }); 
          console.log(`  ❌ ${ch} failed: ${e.message}`);
        }
      }
    }
    writeSummary(results, errors, theme);
    console.log("✅ Done!\n");
  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
