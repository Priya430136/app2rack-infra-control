// Thin abstraction over external LLM providers. Nothing in this file is
// required for the app to run - when no API key is configured, isConfigured()
// returns false and callers fall back to the rule-based engines instead.
// Supports OpenAI and Anthropic behind one interface, selected by AI_PROVIDER
// (defaults to whichever key is actually set).

const PROVIDER = (process.env.AI_PROVIDER || (process.env.ANTHROPIC_API_KEY ? 'anthropic' : 'openai')).toLowerCase();
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';
const OPENAI_MODEL = process.env.OPENAI_MODEL || 'gpt-4o-mini';
const OPENAI_BASE_URL = (process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1').replace(/\/$/, '');
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY || '';
const ANTHROPIC_MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const isConfigured = () => {
  if (PROVIDER === 'anthropic') return Boolean(ANTHROPIC_API_KEY);
  return Boolean(OPENAI_API_KEY);
};

const getModelName = () => (PROVIDER === 'anthropic' ? ANTHROPIC_MODEL : OPENAI_MODEL);

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('AI response did not contain JSON');
  return JSON.parse(candidate.slice(start, end + 1));
}

async function callOpenAI(system, prompt) {
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      max_tokens: 3072,
      temperature: 0.3,
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`OpenAI request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json.choices?.[0]?.message?.content;
  if (!text) throw new Error('OpenAI response had no content');
  return extractJson(text);
}

async function callAnthropic(system, prompt) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 4096,
      system,
      messages: [{ role: 'user', content: prompt }],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic request failed (${res.status}): ${body.slice(0, 300)}`);
  }
  const json = await res.json();
  const text = json.content?.[0]?.text;
  if (!text) throw new Error('Anthropic response had no content');
  return extractJson(text);
}

/**
 * Sends a system+user prompt to the configured provider and parses the
 * response as JSON. Throws if no provider is configured - callers should
 * check isConfigured() first and use a fallback instead of calling this blind.
 */
async function completeJson(system, prompt) {
  if (!isConfigured()) {
    throw new Error('No AI provider configured');
  }
  return PROVIDER === 'anthropic' ? callAnthropic(system, prompt) : callOpenAI(system, prompt);
}

/**
 * Free-form text completion, used for chat follow-ups (no JSON requirement).
 */
async function completeText(system, prompt) {
  if (!isConfigured()) {
    throw new Error('No AI provider configured');
  }
  if (PROVIDER === 'anthropic') {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 1024,
        system,
        messages: [{ role: 'user', content: prompt }],
      }),
    });
    if (!res.ok) throw new Error(`Anthropic request failed (${res.status})`);
    const json = await res.json();
    return json.content?.[0]?.text || '';
  }
  const res = await fetch(`${OPENAI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: prompt },
      ],
      max_tokens: 1024,
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`OpenAI request failed (${res.status})`);
  const json = await res.json();
  return json.choices?.[0]?.message?.content || '';
}

module.exports = { isConfigured, getModelName, completeJson, completeText, PROVIDER };
