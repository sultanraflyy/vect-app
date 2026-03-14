/**
 * Vect Content Generation Engine
 *
 * Autonomous content generation for 7 channels using Gemini API.
 * Orchestrated by GitHub Actions cron jobs.
 *
 * Usage:
 * node engine.js                  # Generate all channels
 * node engine.js --channel reddit # Generate specific channel
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
// Prompt Loader
// ---------------------------------------------------------------------------

function loadPromptTemplate(channel) {
  const promptPath = path.join(__dirname, 'prompts', `${channel}.md`);
  if (!fs.existsSync(promptPath)) {
    throw new Error(`Prompt template not found: ${promptPath}`);
  }
  return fs.readFileSync(promptPath, 'utf-8');
}

function loadVoiceModel() {
  return fs.readFileSync(
    path.join(__dirname, 'prompts', 'voice-model.md'),
    'utf-8'
  );
}

// ---------------------------------------------------------------------------
// Theme Selector
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Content Validators
// ---------------------------------------------------------------------------

function validateVoice(text) {
  const issues = [];
  const lowerText = text.toLowerCase();

  for (const word of config.voiceModel.bannedWords) {
    if (lowerText.includes(word.toLowerCase())) {
      issues.push(`Contains banned word/phrase: "${word}"`);
    }
  }

  const exclamationCount = (text.match(/!/g) || []).length;
  if (exclamationCount > config.voiceModel.maxExclamationMarks) {
    issues.push(`Too many exclamation
