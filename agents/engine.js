/**
 * Vect Content Generation Engine
 */

const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');

// ---------------------------------------------------------------------------
// Gemini API Client
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
// Channel Generators
// ---------------------------------------------------------------------------

async function generateReddit(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('reddit')}`;
  const usr = `Generate a Reddit post.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'reddit', content, theme };
}

async function generateLinkedIn(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('linkedin')}`;
  const usr = `Generate a LinkedIn post.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'linkedin', content, theme };
}

async function generateXThread(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('x-thread')}`;
  const usr = `Generate a 7-tweet X thread.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'x-thread', content, theme };
}

async function generateInstagram(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('instagram')}`;
  const usr = `Generate an Instagram caption.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'instagram', content, theme };
}

async function generateOutreach(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('outreach')}`;
  const usr = `Generate outreach templates.\nTHEME: ${theme}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'outreach', content, theme };
}

async function generateCommunity(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('community')}`;
  const usr = `Generate 3 Slack responses.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(sys, usr);
  return { channel: 'community', content, theme };
}

async function generateBlog(theme, trendSignals) {
  const sys = `${loadVoiceModel()}\n\n${loadPromptTemplate('blog')}`;
  const usr = `Generate a SEO micro-blog.\nTHEME: ${theme}\nTREND:\n${trendSignals || 'None'}\nOutput as JSON.`;
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

  results.forEach(result => {
    const rawContent = result.content || '';
    
    // Robust JSON extraction
    let parsed = null;
    try {
      // Method 1: Try direct JSON parse (if Gemini returned pure JSON)
      parsed = JSON.parse(rawContent);
    } catch {
      try {
        // Method 2: Extract from markdown code blocks
        let jsonStr = '';
        if (rawContent.includes('```json')) {
          jsonStr = rawContent.split('```json')[1].split('```')[0].trim();
        } else if (rawContent.includes('```')) {
          jsonStr = rawContent.split('```')[1].split('```')[0].trim();
        } else if (rawContent.includes('{')) {
          // Method 3: Extract first complete JSON object
          const firstBrace = rawContent.indexOf('{');
          const lastBrace = rawContent.lastIndexOf('}');
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            jsonStr = rawContent.substring(firstBrace, lastBrace + 1);
          }
        }
        
        if (jsonStr) {
          parsed = JSON.parse(jsonStr);
        }
      } catch (parseErr) {
        console.warn(`  ⚠ Failed to parse ${result.channel} content:`, parseErr.message);
      }
    }

    // Populate Make.com payload with clean data
    if (result.channel === 'linkedin') {
      if (parsed && parsed.post_body) {
        makecomPayload.linkedin_text = parsed.post_body;
        makecomPayload.linkedin_ready = true;
      } else if (rawContent.trim().length > 50) {
        // Fallback: use raw if it's substantial
        makecomPayload.linkedin_text = rawContent;
        makecomPayload.linkedin_ready = true;
      }
    }

    if (result.channel === 'x-thread') {
      if (parsed && Array.isArray(parsed.tweets)) {
        makecomPayload.twitter_text = parsed.tweets
          .map(t => (typeof t === 'string' ? t : t.text || ''))
          .filter(Boolean)
          .join('\n\n');
        makecomPayload.twitter_ready = true;
      } else if (rawContent.trim().length > 50) {
        makecomPayload.twitter_text = rawContent;
        makecomPayload.twitter_ready = true;
      }
    }

    if (result.channel === 'instagram') {
      if (parsed && parsed.caption) {
        makecomPayload.instagram_text = parsed.caption;
        makecomPayload.instagram_ready = true;
      } else if (rawContent.trim().length > 50) {
        makecomPayload.instagram_text = rawContent;
        makecomPayload.instagram_ready = true;
      }
    }

    if (result.channel === 'outreach') {
      if (parsed && parsed.cold_email && parsed.cold_email.body) {
        makecomPayload.outreach_body = parsed.cold_email.body;
        makecomPayload.outreach_subject = parsed.cold_email.subject_line || '';
        makecomPayload.outreach_ready = true;
      } else if (rawContent.trim().length > 50) {
        makecomPayload.outreach_body = rawContent;
        makecomPayload.outreach_ready = true;
      }
    }
  });

  const payloadPath = path.join(repoRoot, 'content', 'latest-payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(makecomPayload, null, 2), 'utf-8');
  
  // Validation output
  const readyCount = Object.values(makecomPayload).filter(v => v === true).length;
  console.log(`\n  ✓ Make.com payload saved: ${payloadPath}`);
  console.log(`    Ready channels: ${readyCount}/4`);
  if (readyCount === 0) {
    console.warn(`    ⚠ WARNING: No channels marked as ready! Check Gemini output format.`);
  }
}

async function main() {
  const args = process.argv.slice(2);
  const chIdx = args.indexOf('--channel');
  const targetChannel = chIdx >= 0 ? args[chIdx + 1] : null;

  const results = [];
  const errors = [];
  const theme = getWeeklyTheme();

  try {
    if (targetChannel) {
      console.log(`📝 Generating ${targetChannel}...`);
      results.push(await CHANNEL_GENERATORS[targetChannel](theme, null));
    } else {
      for (const [ch, generator] of Object.entries(CHANNEL_GENERATORS)) {
        console.log(`📝 Generating ${ch}...`);
        try { results.push(await generator(theme, null)); } 
        catch (e) { errors.push({ channel: ch, error: e.message }); }
      }
    }
    writeSummary(results, errors, theme);
    console.log("✅ Done!");
  } catch (error) {
    console.error(`💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
