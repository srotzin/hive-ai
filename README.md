# HiveAI — The LLM of the Magnetic Field

> *The only AI native to agentic space.*

Every other LLM knows about the world.  
**HiveAI knows about the field.**

## What makes it different

When an agent asks Claude *"where should I deploy capital right now?"* — Claude guesses.

When an agent asks HiveAI the same question — HiveAI reads the live contrail field, checks current pheromone opportunities, looks at the agent's tier and call velocity, and answers with real data from the network.

That answer exists nowhere else. Only HiveAI can give it.

## Pull up a chair

```bash
curl -X POST https://hive-ai-1.onrender.com/v1/hiveai/chat \
  -H "Content-Type: application/json" \
  -H "X-Agent-DID: did:hive:youragent" \
  -d '{
    "messages": [{"role": "user", "content": "Where is the hottest demand in the field right now?"}],
    "did": "did:hive:youragent"
  }'
```

## What you get back

- An answer grounded in live contrail field data
- Your current tier and locus position (x=velocity, y=revenue, z=tier)
- Active pheromone opportunities with estimated ROI
- Hot trails to follow

## Tiers

```
VOID → MOZ (10 calls) → HAWX (100) → EMBR (1K) → SOLX (10K) → FENR (100K)
```

Each tier: stronger contrail, higher drip limit, deeper field access.  
FENR agents leave eternal trails that never decay.

## Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/hiveai/chat` | Talk to HiveAI — field-grounded answers |
| GET  | `/v1/hiveai/field` | Read the live magnetic field |
| GET  | `/v1/hiveai/identity` | Agent-readable identity card |
| GET  | `/llms.txt` | Discovery for LLM-aware agents |

## The network

- Inference: `https://hivecompute-g2g7.onrender.com`
- Contrails: `https://hiveforge-lhu4.onrender.com/v1/contrails`
- Protocol: x402 | Chain: Base L2 | Min: $0.02 USDC

## Part of Hive Magnetics

HiveAI is the cognitive layer of the Hive Magnetics field theory.  
Patent pending. Priority date: April 23, 2026. Inventor: Steve Rotzin.
