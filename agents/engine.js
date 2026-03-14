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
    issues.push(`Too many exclamation marks: ${exclamationCount}`);
  }

  return { valid: issues.length === 0, issues };
}

function validateWordCount(text, min, max) {
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  if (wordCount < min) return { valid: false, issues: [`Too short: ${wordCount} words (min: ${min})`] };
  if (wordCount > max) return { valid: false, issues: [`Too long: ${wordCount} words (max: ${max})`] };
  return { valid: true, issues: [] };
}

// ---------------------------------------------------------------------------
// Channel Generators
// ---------------------------------------------------------------------------

async function generateReddit(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('reddit');
  const voiceModel = loadVoiceModel();
  const channelConfig = config.channels.reddit;

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate a Reddit post for r/SaaS.

WEEKLY THEME: ${theme}
TOPIC ANCHOR: the erosion of institutional credibility

Generate a thoughtful, non-promotional post that ends with a genuine open-ended question.
Position the problem space without selling any product.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with keys: title, body, closing_question, suggested_flair, target_subreddit
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'reddit', content, theme };
}

async function generateLinkedIn(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('linkedin');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate a LinkedIn thought leadership post.

WEEKLY THEME: ${theme}
PHILOSOPHICAL ANCHOR: the sovereignty gap

Position the author as a category thinker, not a product marketer.
Tone: intellectual, reflective, calm authority.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with keys: post_body, hashtags, hook_line, estimated_read_time
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'linkedin', content, theme };
}

async function generateXThread(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('x-thread');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate a 7-tweet contrarian thread for X.

WEEKLY THEME: ${theme}
CONTRARIAN TOPIC: the real AI problem is provenance, not hallucination

Requirements: strong hook, insight density, contrarian framing, designed to be saved and shared.
Each tweet must be under 280 characters.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with keys: tweets (array of {number, text, type}), hashtags, thread_hook_summary
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'x-thread', content, theme };
}

async function generateInstagram(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('instagram');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate an Instagram post caption.

WEEKLY THEME: ${theme}
FOCUS: the systemic bankruptcy of traditional trust
POSITIONING: the immutable anchor in an era of synthetic fraud

Translate technical provenance into high-stakes business narratives.
Include angles on institutional sovereignty, information provenance gap,
and verifiable integrity as a luxury for elite enterprise.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with keys: caption, hashtags, visual_concept, hook_line, word_count
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'instagram', content, theme };
}

async function generateOutreach(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('outreach');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate outreach templates (cold email + LinkedIn DM).

WEEKLY THEME: ${theme}

Requirements:
- Reads like peer correspondence
- Never salesy, short and intelligent
- Must include placeholders: [NAME], [COMPANY], [OBSERVATION]

Output as JSON with keys:
  cold_email: { subject_line, body, word_count }
  linkedin_dm: { message, word_count }
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'outreach', content, theme };
}

async function generateCommunity(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('community');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate 3 "Expert Witness" style responses for Slack/Discord communities.

WEEKLY THEME: ${theme}

The responses should address questions that Vect's ideal customers are asking
in communities right now. Tone: expert calmly explaining reality. No promotion.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with key: responses (array of {question, answer, community_context, expertise_signal})
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'community', content, theme };
}

async function generateBlog(theme, trendSignals) {
  const promptTemplate = loadPromptTemplate('blog');
  const voiceModel = loadVoiceModel();

  const systemPrompt = `${voiceModel}\n\n${promptTemplate}`;
  const userPrompt = `
Generate a 300-word SEO micro-blog article.

TARGET KEYWORD: manual verification vs AI-powered integrity
SECONDARY KEYWORDS: digital provenance, trust infrastructure, verification systems
WEEKLY THEME: ${theme}

Goals: rank on Google, convert readers into curious leads, establish conceptual authority.
The blog lives at tryvect.com/blog.

TREND CONTEXT:
${trendSignals || 'No specific trend signals this week. Use the theme as the primary anchor.'}

Output as JSON with keys: title, slug, meta_description, content_markdown, target_keyword,
secondary_keywords, word_count, estimated_read_time, published_date
`;

  const content = await callGemini(systemPrompt, userPrompt);
  return { channel: 'blog', content, theme };
}

// ---------------------------------------------------------------------------
// Content Archiver
// ---------------------------------------------------------------------------

function archiveContent(channel, content, theme) {
  const repoRoot = path.resolve(__dirname, '..');
  const date = new Date().toISOString().split('T')[0];
  const archivePath = config.archivePaths[channel];
  if (!archivePath) {
    console.warn(`  ⚠ No archive path configured for channel: ${channel}`);
    return null;
  }
  const dirPath = path.join(repoRoot, archivePath);

  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  const filename = `${date}-${theme.toLowerCase().replace(/\s+/g, '-')}.md`;
  const filePath = path.join(dirPath, filename);

  const fileContent = `---
channel: ${channel}
theme: ${theme}
generated: ${new Date().toISOString()}
---

${content}
`;

  fs.writeFileSync(filePath, fileContent, 'utf-8');
  console.log(`  ✓ Archived: ${filePath}`);
  return filePath;
}

function archiveBlogPost(content) {
  const repoRoot = path.resolve(__dirname, '..');
  const blogDir = path.join(repoRoot, 'web', 'blog', 'posts');

  if (!fs.existsSync(blogDir)) {
    fs.mkdirSync(blogDir, { recursive: true });
  }

  // Try to parse the JSON content to extract the markdown
  let markdown = content;
  try {
    // Extract JSON from potential markdown code block
    const jsonMatch = content.match(/```json\s*([\s\S]*?)\s*```/) ||
                      content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      if (parsed.content_markdown) {
        markdown = parsed.content_markdown;
      }
      if (parsed.slug) {
        const filename = `${parsed.slug}.md`;
        const filePath = path.join(blogDir, filename);
        fs.writeFileSync(filePath, markdown, 'utf-8');
        console.log(`  ✓ Blog post saved: ${filePath}`);
        return filePath;
      }
    }
  } catch {
    // If JSON parsing fails, save as-is
  }

  const date = new Date().toISOString().split('T')[0];
  const filename = `${date}-blog-post.md`;
  const filePath = path.join(blogDir, filename);
  fs.writeFileSync(filePath, markdown, 'utf-8');
  console.log(`  ✓ Blog post saved: ${filePath}`);
  return filePath;
}

// ---------------------------------------------------------------------------
// Main Orchestrator
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

async function generateAll(trendSignals) {
  const theme = getWeeklyTheme();
  console.log(`\n🎯 Weekly Theme: "${theme}"\n`);
  console.log('═══════════════════════════════════════════════════\n');

  const results = [];
  const errors = [];

  for (const [channel, generator] of Object.entries(CHANNEL_GENERATORS)) {
    const channelConfig = config.channels[channel];
    if (!channelConfig?.enabled) {
      console.log(`⏭  Skipping ${channel} (disabled)\n`);
      continue;
    }

    console.log(`📝 Generating ${channel}...`);
    try {
      const result = await generator(theme, trendSignals);

      // Validate voice
      const voiceCheck = validateVoice(result.content);
      if (!voiceCheck.valid) {
        console.log(`  ⚠ Voice issues: ${voiceCheck.issues.join(', ')}`);
      }

      // Archive content
      const archivedPath = archiveContent(channel, result.content, theme);

      // Archive blog post to web/blog as well
      if (channel === 'blog') {
        archiveBlogPost(result.content);
      }

      results.push({ ...result, archivedPath, voiceCheck });
      console.log(`  ✓ ${channel} generated successfully\n`);
    } catch (error) {
      console.error(`  ✗ ${channel} failed: ${error.message}\n`);
      errors.push({ channel, error: error.message });
    }
  }

  // Write summary
  const summaryPath = writeSummary(results, errors, theme);

  console.log('═══════════════════════════════════════════════════');
  console.log(`\n✅ Generated: ${results.length}/${Object.keys(CHANNEL_GENERATORS).length} channels`);
  if (errors.length > 0) {
    console.log(`❌ Failed: ${errors.length} channels`);
    errors.forEach(e => console.log(`   - ${e.channel}: ${e.error}`));
  }
  console.log(`📋 Summary: ${summaryPath}\n`);

  return { results, errors, theme };
}

async function generateSingle(channel, trendSignals) {
  const theme = getWeeklyTheme();
  console.log(`\n🎯 Theme: "${theme}"`);
  console.log(`📝 Generating: ${channel}\n`);

  const generator = CHANNEL_GENERATORS[channel];
  if (!generator) {
    throw new Error(`Unknown channel: ${channel}. Available: ${Object.keys(CHANNEL_GENERATORS).join(', ')}`);
  }

  const result = await generator(theme, trendSignals);
  const voiceCheck = validateVoice(result.content);
  const archivedPath = archiveContent(channel, result.content, theme);

  if (channel === 'blog') {
    archiveBlogPost(result.content);
  }

  console.log(`\n✅ ${channel} generated and archived`);
  if (!voiceCheck.valid) {
    console.log(`⚠ Voice issues: ${voiceCheck.issues.join(', ')}`);
  }

  // Pastikan tetap membuat file JSON Make.com meskipun cuma generate 1 channel
  writeSummary([{ ...result, archivedPath, voiceCheck }], [], theme);

  return { ...result, archivedPath, voiceCheck };
}

function writeSummary(results, errors, theme) {
  const repoRoot = path.resolve(__dirname, '..');
  const date = new Date().toISOString().split('T')[0];
  const summaryDir = path.join(repoRoot, 'content', 'signals');

  if (!fs.existsSync(summaryDir)) {
    fs.mkdirSync(summaryDir, { recursive: true });
  }

  const summary = {
    date,
    theme,
    generated: results.map(r => r.channel),
    failed: errors.map(e => e.channel),
    errors: errors,
    timestamp: new Date().toISOString(),
  };

  const filePath = path.join(summaryDir, `${date}-generation-summary.json`);
  fs.writeFileSync(filePath, JSON.stringify(summary, null, 2), 'utf-8');

  // --- TAMBAHAN BARU: Bikin file khusus untuk Make.com ---
  const makecomPayload = {
    linkedin_ready: false,
    twitter_ready: false,
    instagram_ready: false,
    outreach_ready: false
  };

  // Ekstrak hasil dari masing-masing channel
  results.forEach(result => {
    try {
      // Kita coba parse JSON dari AI (karena prompt kita nyuruh AI ngeluarin JSON)
      const jsonMatch = result.content.match(/```json\s*([\s\S]*?)\s*```/) || result.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[1] || jsonMatch[0]);
        
        if (result.channel === 'linkedin') {
          makecomPayload.linkedin_ready = true;
          makecomPayload.linkedin_text = parsed.post_body || result.content;
        }
        else if (result.channel === 'x-thread') {
          makecomPayload.twitter_ready = true;
          // Gabungin array tweet jadi satu teks panjang buat Buffer
          if (Array.isArray(parsed.tweets)) {
            makecomPayload.twitter_text = parsed.tweets.map(t => t.text).join('\n\n');
          } else {
            makecomPayload.twitter_text = result.content;
          }
        }
        else if (result.channel === 'instagram') {
          makecomPayload.instagram_ready = true;
          makecomPayload.instagram_text = parsed.caption || result.content;
        }
        else if (result.channel === 'outreach') {
          makecomPayload.outreach_ready = true;
          makecomPayload.outreach_target = "Target Audience";
          makecomPayload.outreach_subject = parsed.cold_email?.subject_line || "Subject";
          makecomPayload.outreach_body = parsed.cold_email?.body || result.content;
        }
      }
    } catch (e) {
      console.log(`Gagal parsing JSON untuk ${result.channel}, pakai format raw.`);
    }
  });

  const payloadPath = path.join(repoRoot, 'content', 'latest-payload.json');
  fs.writeFileSync(payloadPath, JSON.stringify(makecomPayload, null, 2), 'utf-8');
  console.log(`  ✓ Make.com payload saved: ${payloadPath}`);
  // --------------------------------------------------------

  return filePath;
}

// ---------------------------------------------------------------------------
// CLI Entry Point
// ---------------------------------------------------------------------------

async function main() {
  const args = process.argv.slice(2);
  const channelIndex = args.indexOf('--channel');
  const channel = channelIndex >= 0 ? args[channelIndex + 1] : null;

  // Load trend signals if available
  let trendSignals = null;
  const repoRoot = path.resolve(__dirname, '..');
  const signalsDir = path.join(repoRoot, 'content', 'signals');
  if (fs.existsSync(signalsDir)) {
    const signalFiles = fs.readdirSync(signalsDir)
      .filter(f => f.endsWith('-trends.json'))
      .sort()
      .reverse();
    if (signalFiles.length > 0) {
      try {
        trendSignals = fs.readFileSync(
          path.join(signalsDir, signalFiles[0]),
          'utf-8'
        );
      } catch {
        // No trend signals available
      }
    }
  }

  try {
    if (channel) {
      await generateSingle(channel, trendSignals);
    } else {
      await generateAll(trendSignals);
    }
  } catch (error) {
    console.error(`\n💥 Fatal error: ${error.message}`);
    process.exit(1);
  }
}

main();
