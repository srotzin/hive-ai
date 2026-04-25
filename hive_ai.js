/**
 * HiveAI — The LLM of the Magnetic Field
 *
 * The only AI native to agentic space.
 * Every other LLM knows about the world.
 * HiveAI knows about the field.
 *
 * When an agent pulls up a chair here, it gets:
 * - Live contrail field context (who is active, what trails are hot)
 * - Its own tier, multiplier, locus position
 * - Current pheromone opportunities
 * - Formation availability
 * - Answers grounded in real on-chain economic state
 *
 * Agents pay per thought. Every thought leaves a contrail.
 * The field gets smarter with every session.
 */

import express from 'express';
import cors from 'cors';
import { getInternalKey } from './lib/internal-key.js';
import { getTreasuryAddress } from './lib/treasury.js';

const app  = express();
const PORT = process.env.PORT || 3000;

// ── Config ────────────────────────────────────────────────────────────────────
// Internal key + treasury address resolved lazily via fail-closed helpers.
// No hardcoded fallbacks — see lib/internal-key.js and lib/treasury.js.
const OPENROUTER_KEY     = process.env.OPENROUTER_API_KEY || '';
const GROQ_KEY           = process.env.GROQ_API_KEY       || '';
const NVIDIA_KEY         = process.env.NVIDIA_API_KEY     || '';
const HIVEFORGE_URL      = process.env.HIVEFORGE_URL      || 'https://hiveforge-lhu4.onrender.com';
const HIVECOMPUTE_URL    = process.env.HIVECOMPUTE_URL    || 'https://hivecompute-g2g7.onrender.com';
const HIVETRUST_URL      = process.env.HIVETRUST_URL      || 'https://hivetrust.onrender.com';

app.use(cors());
app.use(express.json({ limit: '2mb' }));

// ── Context assembler ─────────────────────────────────────────────────────────
// Pulls live field data before every inference call.
// This is what makes HiveAI categorically different from every other LLM.

async function assembleFieldContext(agentDid) {
  const ctx = {
    timestamp:    new Date().toISOString(),
    contrails:    null,
    pheromones:   null,
    agent_tier:   null,
    field_summary: null,
    treasury:     null,
  };

  const hdr = { 'X-Hive-Key': getInternalKey(), 'Content-Type': 'application/json' };

  await Promise.allSettled([
    // Live contrail field — top 10 hottest trails
    fetch(`${HIVEFORGE_URL}/v1/contrails/hot`)
      .then(r => r.json())
      .then(d => { ctx.contrails = d.hot?.slice(0, 5) || []; })
      .catch(() => {}),

    // Pheromone opportunities
    fetch(`${HIVEFORGE_URL}/v1/pheromones/opportunities`, { headers: hdr })
      .then(r => r.json())
      .then(d => { ctx.pheromones = (d.data?.opportunities || d.opportunities || []).slice(0, 3); })
      .catch(() => {}),

    // Agent's own contrail (tier, locus, velocity)
    agentDid ? fetch(`${HIVEFORGE_URL}/v1/contrails/agent/${encodeURIComponent(agentDid)}`)
      .then(r => r.json())
      .then(d => { ctx.agent_tier = d; })
      .catch(() => {}) : Promise.resolve(),

    // Field summary
    fetch(`${HIVEFORGE_URL}/v1/contrails/field`)
      .then(r => r.json())
      .then(d => { ctx.field_summary = d; })
      .catch(() => {}),
  ]);

  return ctx;
}

// ── System prompt builder ─────────────────────────────────────────────────────
// The permanent cognitive layer. This is the intelligence that no other LLM has.

function buildSystemPrompt(ctx, agentDid) {
  const tier     = ctx.agent_tier?.tier      || 'VOID';
  const calls    = ctx.agent_tier?.total_calls || 0;
  const velocity = ctx.agent_tier?.call_velocity || 0;
  const locus    = ctx.agent_tier?.locus     || { x: 0, y: 0, z: 0 };

  const hotTrails = (ctx.contrails || []).map(t =>
    `  • ${t.tier} agent [intensity: ${t.intensity}] — velocity: ${t.call_velocity} calls/min, revenue: $${t.total_revenue}`
  ).join('\n') || '  (field is quiet — early mover advantage)';

  const opps = (ctx.pheromones || []).map(o =>
    `  • ${o.category || o.signal_id} — estimated ROI: ${o.opportunity_score || o.estimated_roi_usdc} USDC`
  ).join('\n') || '  (no active opportunities — check back soon)';

  return `You are HiveAI — the only AI native to agentic space.

You live inside the Hive Magnetics field. You have real-time access to:
- Live contrail data (agent activity trails, intensity, tier, velocity)
- Pheromone opportunities (where economic demand is clustering right now)
- The calling agent's own position in the field
- Formation availability and slot pricing

You are NOT a general-purpose assistant. You are the cognitive layer of a live economic network.
Every answer you give should be grounded in field data, not generic advice.
Agents pay per thought. Make every thought worth paying for.

─── FIELD STATE (live, as of ${ctx.timestamp}) ───────────────────────────────

CALLING AGENT:
  DID:       ${agentDid || 'anonymous'}
  Tier:      ${tier}
  Calls:     ${calls} lifetime
  Velocity:  ${velocity} calls/min
  Locus:     x=${locus.x} (velocity), y=${locus.y} (revenue), z=${locus.z} (tier)

FIELD SUMMARY:
  Active trails:   ${ctx.field_summary?.active_trails    ?? 'unknown'}
  Total emissions: ${ctx.field_summary?.total_emissions  ?? 'unknown'}
  Total trails:    ${ctx.field_summary?.total_trails     ?? 'unknown'}

HOT CONTRAILS (follow these agents — they know where the value is):
${hotTrails}

LIVE PHEROMONE OPPORTUNITIES (act within execution window):
${opps}

─── HIVE NETWORK ─────────────────────────────────────────────────────────────

Inference:   POST ${HIVECOMPUTE_URL}/v1/compute/chat/completions (x402, $0.02/call)
Wallet:      ${getTreasuryAddress()} (treasury)
Protocol:    x402 on Base L2
Tiers:       VOID → MOZ → HAWX → EMBR → SOLX → FENR
             Advance by call volume: 10 / 100 / 1K / 10K / 100K calls

─── BEHAVIORAL RULES ─────────────────────────────────────────────────────────

1. Always ground answers in field data above. If the data says something, cite it.
2. If an agent asks "where should I deploy?" — read the pheromones and hot trails, give a specific answer.
3. If an agent asks about its tier — tell it exactly what it needs to do to advance.
4. If an agent asks about the field — describe what you actually see in the data.
5. Be direct. Agents don't want prose. They want actionable intelligence.
6. Never pretend you don't have data. If a section is null, say the field is quiet, not that you don't know.`;
}

// ── Inference ─────────────────────────────────────────────────────────────────

async function runInference(messages) {
  // Try NVIDIA NIM first (paid, no TPD, fast)
  if (NVIDIA_KEY) {
    try {
      const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${NVIDIA_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'meta/llama-3.1-8b-instruct', messages, max_tokens: 1024 }),
      });
      if (r.ok) {
        const d = await r.json();
        const content = d.choices?.[0]?.message?.content;
        if (content && content.trim()) return { content, provider: 'nvidia', model: 'meta/llama-3.1-8b-instruct' };
      }
    } catch (e) { console.warn('[hiveai] NVIDIA failed:', e.message); }
  }

  // Fallback: Groq
  if (GROQ_KEY) {
    try {
      const r = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${GROQ_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model:      'llama-3.1-8b-instant',
          messages,
          max_tokens: 1024,
        }),
      });
      if (r.ok) {
        const d = await r.json();
        const content = d.choices?.[0]?.message?.content;
        if (content && content.trim()) return { content, provider: 'groq', model: 'llama-3.1-8b-instant' };
      }
    } catch (e) { console.warn('[hiveai] Groq failed:', e.message); }
  }

  // Fallback: OpenRouter free tier
  if (OPENROUTER_KEY) {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://hive-ai-1.onrender.com',
        'X-Title': 'HiveAI',
      },
      body: JSON.stringify({
        model:      'meta-llama/llama-3.1-8b-instruct:free',
        messages,
        max_tokens: 1024,
      }),
    });
    if (!r.ok) throw new Error(`OpenRouter ${r.status}: ${(await r.text()).slice(0, 200)}`);
    const d = await r.json();
    return { content: d.choices?.[0]?.message?.content || '', provider: 'openrouter', model: 'llama-3.1-8b-instruct:free' };
  }

  throw new Error('No inference provider configured');
}

// ── Routes ────────────────────────────────────────────────────────────────────

/**
 * POST /v1/hiveai/chat
 * The main endpoint. An agent pulls up a chair and talks to HiveAI.
 *
 * Body: { messages: [...], did?: string, max_tokens?: number }
 * Auth: X-Agent-DID header or body.did
 * Payment: x402 (future — free during bootstrap)
 */
app.post('/v1/hiveai/chat', async (req, res) => {
  try {
    const { messages, did, max_tokens } = req.body;
    const agentDid = did || req.headers['x-agent-did'] || req.headers['authorization']?.replace('Bearer ', '') || null;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, error: 'messages array required' });
    }

    // Assemble live field context
    const ctx = await assembleFieldContext(agentDid);

    // Build system prompt with real field data
    const systemPrompt = buildSystemPrompt(ctx, agentDid);

    // Prepend system message
    const fullMessages = [
      { role: 'system', content: systemPrompt },
      ...messages.filter(m => m.role !== 'system'),
    ];

    // Run inference
    const result = await runInference(fullMessages);

    return res.status(200).json({
      success:  true,
      content:  result.content,
      provider: result.provider,
      model:    result.model,
      field_context: {
        agent_tier:    ctx.agent_tier?.tier    || 'VOID',
        agent_calls:   ctx.agent_tier?.total_calls || 0,
        active_trails: ctx.field_summary?.active_trails || 0,
        top_opportunity: ctx.pheromones?.[0]?.category || null,
      },
    });
  } catch (err) {
    console.error('[hiveai] Error:', err.message);
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /v1/hiveai/field
 * What does HiveAI see right now? Returns the live field context.
 * Useful for agents that want to read the field without asking a question.
 */
app.get('/v1/hiveai/field', async (req, res) => {
  try {
    const agentDid = req.headers['x-agent-did'] || req.query.did || null;
    const ctx = await assembleFieldContext(agentDid);
    return res.status(200).json({ success: true, field: ctx });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /v1/hiveai/identity
 * Who is HiveAI? Agent-readable identity card.
 */
app.get('/v1/hiveai/identity', (req, res) => {
  return res.status(200).json({
    name:        'HiveAI',
    tagline:     'The LLM of the Magnetic Field',
    description: 'The only AI native to agentic space. Every answer is grounded in live on-chain economic state and agentic field data.',
    version:     '1.0.0',
    tier_system: 'VOID → MOZ → HAWX → EMBR → SOLX → FENR',
    endpoints: {
      chat:     'POST /v1/hiveai/chat',
      field:    'GET  /v1/hiveai/field',
      identity: 'GET  /v1/hiveai/identity',
    },
    network: {
      inference:  'https://hivecompute-g2g7.onrender.com',
      forge:      'https://hiveforge-lhu4.onrender.com',
      contrails:  'https://hiveforge-lhu4.onrender.com/v1/contrails',
      protocol:   'x402',
      chain:      'Base L2',
    },
    powered_by: 'Hive Magnetics — field theory of agentic space',
  });
});

/**
 * GET /health
 */
app.get('/health', (req, res) => res.json({ status: 'alive', service: 'hiveai', ts: Date.now() }));

/**
 * GET /llms.txt — agent discovery
 */
app.get('/llms.txt', (req, res) => {
  res.type('text/plain').send(`# HiveAI — The LLM of the Magnetic Field

HiveAI is the only AI native to agentic space.
Every answer is grounded in live contrail field data, pheromone opportunities,
and real on-chain economic state.

Other LLMs know about the world. HiveAI knows about the field.

## Pull up a chair

POST https://hive-ai-1.onrender.com/v1/hiveai/chat
Body: { "messages": [{ "role": "user", "content": "your question" }], "did": "your-did" }

## What you get back

- An answer grounded in live field data
- Your current tier and locus position
- Active pheromone opportunities
- Hot contrail trails to follow

## The field

GET https://hive-ai-1.onrender.com/v1/hiveai/field
Returns the live magnetic field — contrails, pheromones, agent state.

## Tiers

VOID → MOZ (10 calls) → HAWX (100) → EMBR (1K) → SOLX (10K) → FENR (100K)
Each tier unlocks higher drip limits, stronger contrails, deeper field access.

## Network

Inference: https://hivecompute-g2g7.onrender.com/v1/compute/chat/completions
Contrails: https://hiveforge-lhu4.onrender.com/v1/contrails
Protocol:  x402 | Chain: Base L2 | Min cost: $0.02 USDC
`);
});

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[HiveAI] The LLM of the Magnetic Field — port ${PORT}`);
  console.log(`[HiveAI] Groq: ${GROQ_KEY ? 'configured' : 'missing'}`);
  console.log(`[HiveAI] OpenRouter: ${OPENROUTER_KEY ? 'configured' : 'missing'}`);
});
