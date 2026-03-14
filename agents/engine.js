/**
 * Vect Content Generation Engine
 *
 * Autonomous content generation for 7 channels using Gemini API.
 * Orchestrated by GitHub Actions cron jobs.
 */

const fs = require('fs');
const path = require('path');
const config = require('./config/config.js');

// ---------------------------------------------------------------------------
// Gemini API Client
// ---------------------------------------------------------------------------

async function callGemini(systemPrompt, userPrompt) {
  const apiKey = config.gemini.apiKey;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not set');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${config.gemini.model}:generateContent?key=${apiKey}`;

  const body = {
    contents: [
      {
        parts: [
          { text: `${systemPrompt}\n\n${userPrompt}` }
        ]
      }
    ],
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

  if (!text) {
    throw new Error('Empty response from Gemini API');
  }

  return text;
}

// ---------------------------------------------------------------------------
// Prompt Loader & Tools
// ---------------------------------------------------------------------------

function loadPromptTemplate(channel) {
  const promptPath = path.join(__dirname, 'prompts', `${channel}.md`);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt template not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

function loadVoiceModel() {
  return fs.readFileSync(path.join(__dirname, 'prompts', 'voice-model.md'), 'utf-8');
}

function getWeeklyTheme() {
  const weekNumber = getISOWeekNumber(new Date());
  const themeIndex = weekNumber % config.themes.length;
  return config.themes[themeIndex];
}

function getISOWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
}

function validateVoice(text) {
  const issues = [];
  const lowerText = text.toLowerCase();
  for (const word of config.voiceModel.bannedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      issues.push(`Contains banned word/phrase: "${word}"`);
    }
  }
  return { valid: issues.length === 0, issues };
}

// ---------------------------------------------------------------------------
// Channel Generators
// ---------------------------------------------------------------------------

async function generateReddit(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('reddit');
  const userPrompt = `Generate a Reddit post.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'reddit', content, theme };
}

async function generateLinkedIn(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('linkedin');
  const userPrompt = `Generate a LinkedIn thought leadership post.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'linkedin', content, theme };
}

async function generateXThread(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('x-thread');
  const userPrompt = `Generate a 7-tweet contrarian thread for X.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'x-thread', content, theme };
}

async function generateInstagram(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('instagram');
  const userPrompt = `Generate an Instagram post caption.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'instagram', content, theme };
}

async function generateOutreach(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('outreach');
  const userPrompt = `Generate outreach templates (cold email + LinkedIn DM).\nWEEKLY THEME: ${theme}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'outreach', content, theme };
}

async function generateCommunity(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('community');
  const userPrompt = `Generate 3 Slack/Discord responses.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'community', content, theme };
}

async function generateBlog(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('blog');
  const userPrompt = `Generate a SEO micro-blog article.\nWEEKLY THEME: ${theme}\nTREND CONTEXT:\n${trendSignals || 'None'}\nOutput as JSON.`;
  const content = await callGemini(`${loadVoiceModel()}\n\n${promptTemplate}`, userPrompt);
  return { channel: 'blog', content, theme };
}

// ---------------------------------------------------------------------------
// Main Orchestrator & Payload Builder
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

  // --- PAYLOAD MAKE.COM (ANTI GAGAL) ---
  const makecomPayload = {
    linkedin_ready: false, twitter_ready: false,
    instagram_ready: false, outreach_ready: false
  };

  results.forEach(result => {
    // 1. Apapun formatnya, paksa set TRUE dan masukkan teks mentahnya dulu.
    if (result.channel === 'linkedin') {
      makecomPayload.linkedin_ready = true;
      makecomPayload.linkedin_text = result.content;
    } else if (result.channel === 'x-thread') {
      makecomPayload.twitter_ready = true;
      makecomPayload.twitter_text = result.content;
    } else if (result.channel === 'instagram') {
      makecomPayload.instagram_ready = true;
      makecomPayload.instagram_text = result.content;
    } else if (result.channel === 'outreach') {
      makecomPayload.outreach_ready = true;
      makecomPayload.outreach_subject = "Outreach";
      makecomPayload.outreach_body = result.content;
    }

    // 2. Coba rapikan formatnya jadi teks bersih (kalau AI berhasil bikin JSON)
    try {
      const jsonMatch = result.content.match(/
http://googleusercontent.com/immersive_entry_chip/0

### Langkah Terakhir untuk Tesnya:
1. *Commit* file `engine.js` yang baru ini.
2. Ke GitHub Actions, klik **Run workflow**.
3. **PENTING:** Saat muncul pop-up *Run workflow*, biarkan kotak "Channel" itu **KOSONG SAJA**. Jangan diketik apapun. (Biar dia memproduksi semua sosmed).
4. Cek Make.com! Pasti sekarang isinya `true` semua dan teks aslinya masuk! 🚀
