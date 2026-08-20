// InfraBot's answer logic. Runs entirely server-side now (previously this
// exact canned-response logic ran client-side and never touched the backend
// despite the widget showing an "Online" status). Uses the configured LLM
// when available, grounded in the user's real fleet summary; otherwise falls
// back to the same topic-matched reference content as before.
const ai = require('./ai-provider.service');

function answerFallback(message) {
  const p = message.toLowerCase();
  const note = `\n\n_⚙️ Offline mode — AI provider not configured, using rule-based engine._`;

  if (/storage|gb|tb|users|upload|backup/.test(p)) {
    return `**Storage sizing — quick model**
\nFormula:
\`daily_GB = users × upload_MB × uploads/day ÷ 1024 + logs_GB\`
\`monthly_TB = daily_GB × 30 ÷ 1024\`
\`backup_TB = monthly_TB × replication\`
\nRules of thumb:
- Add 20–30% headroom for logs, indexes, temp data
- Replication factor: 2 (single-region) or 3 (multi-region)
- Annual growth: 15–25% for active SaaS
- Tier cold data after 30–90 days to object/archive (50–80% cheaper)
\nExample — 1M DAU × 2 MB × 3 uploads/day:
- ~5,860 GB/day → ~172 TB/mo raw → ~430 TB/mo with ×2.5 backup
- Yearly: ~2 PB with growth
\nRecommended tier: distributed object storage (S3 / GCS) + lifecycle to cold.${note}`;
  }
  if (/rack|server|\bu\b|power|cooling|kw|datacenter|data center/.test(p)) {
    return `**Rack & data-center capacity**
\nAssumptions per rack:
- 42U total, ~36U usable after PDU/switch/cable
- Power budget: 5–10 kW (typical), 15–20 kW (high-density)
- Cooling: ~0.3 tons per kW IT load
\nFormula:
\`racks = ceil(servers × U_per_server ÷ 36)\`
\`power_kW = servers × watts_each ÷ 1000\`
\nExample — 200× 2U servers @ 500W:
- U needed: 400U → **12 racks** base, **14** with N+1 redundancy
- Power: ~100 kW IT → ~140 kW total with PUE 1.4
- Cooling: ~30 tons
\nNext: target PUE ≤ 1.5; use hot/cold aisle containment.${note}`;
  }
  if (/cloud|aws|azure|gcp|cost|cheap|pric/.test(p)) {
    return `**Cloud selection & cost**
\n| Provider | Strength | Best for |
|---|---|---|
| AWS | Broadest services, mature | General workloads, enterprise |
| Azure | MS/AD/Hybrid integration | Windows estates, enterprise IT |
| GCP | Price/perf, data & AI | Analytics, ML, sustained workloads |
\nCost levers (cumulative 40–70% savings):
- Rightsize: drop idle/oversized VMs
- Commit: 1y/3y Reserved or Savings Plans (40–60% off)
- Spot/preemptible for batch (60–90% off)
- Autoscale + scale-to-zero in non-prod
- Storage tiering + lifecycle policies
- Audit egress; use private endpoints
\nRecommendation: start with rightsizing + 1y Savings Plan on steady workloads.${note}`;
  }
  if (/scal|ha\b|redund|dr\b|disaster|availab/.test(p)) {
    return `**Scaling & HA patterns**
\n- **N+1**: one spare per cluster (most common)
- **2N**: full duplicate (mission-critical)
- **Multi-AZ**: protects against AZ failure (target 99.95%)
- **Multi-region**: active-passive or active-active (target 99.99%)
\nDR targets:
- RPO (data loss): 0 (sync) / minutes (async) / hours (backup)
- RTO (recovery): seconds (active-active) → hours (cold standby)
\nStart with multi-AZ + nightly cross-region backup, then graduate.${note}`;
  }
  if (/incident|outage|down|cpu|alert|monitor/.test(p)) {
    return `**Incident triage checklist**
\n1. Confirm scope (users, regions, services)
2. Check recent deploys / config changes (last 24h)
3. Inspect golden signals: latency, traffic, errors, saturation
4. Correlate alerts: CPU / memory / disk / network
5. Rollback if change-induced; failover if infra-induced
6. Communicate status every 15–30 min until resolved
\nAfter: blameless postmortem within 5 business days.${note}`;
  }
  return `Hi! I can help with:
- 📦 Storage sizing & growth forecasting
- 🗄️ Rack, power & cooling planning
- ☁️ Cloud selection (AWS / Azure / GCP) & cost optimization
- 🔁 HA, redundancy & disaster recovery
- 🚨 Incident triage & performance tuning
\nTry: _"How much storage for 500k users uploading 5 MB/day?"_${note}`;
}

async function answer(messages, fleetContext) {
  const last = messages[messages.length - 1]?.content ?? '';

  if (!ai.isConfigured()) {
    return { reply: answerFallback(last), source: 'fallback' };
  }

  const system = `You are InfraBot, an infrastructure operations assistant embedded in the App2Rack platform. Be concise and practical (storage sizing, rack/power/cooling planning, cloud cost, HA/DR, incident triage). The user's current fleet: ${JSON.stringify(fleetContext)}. Use markdown formatting.`;
  const history = messages.map((m) => `${m.role}: ${m.content}`).join('\n');
  try {
    const reply = await ai.completeText(system, history);
    return { reply, source: 'ai' };
  } catch (err) {
    console.error('AI InfraBot chat failed, falling back to rule-based engine:', err.message);
    return { reply: answerFallback(last), source: 'fallback' };
  }
}

module.exports = { answer };
