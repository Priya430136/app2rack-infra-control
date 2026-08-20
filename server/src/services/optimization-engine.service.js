// Produces an OptimizationReport (see rackvue-insight/src/lib/optimization-advisor.functions.ts
// for the exact shape the frontend renders), from the user's REAL infrastructure
// (racks/servers/applications/incidents), either via the configured LLM or a
// rule-based heuristic engine used whenever no AI provider is configured.
const ai = require('./ai-provider.service');

function rec(title, description, priority, timeframe, target) {
  return {
    title, description, priority, confidence: 70, effort: 'Medium',
    business_impact: 'Improves reliability and reduces cost',
    expected_improvement: '10-25% efficiency gain', responsible_team: 'SRE / Infra', timeframe, target,
  };
}

function runFallbackAnalysis({ servers = [], racks = [], applications = [], incidents = [] } = {}) {
  const avgCpu = servers.length ? Math.round(servers.reduce((a, s) => a + (Number(s.cpu) || 40), 0) / servers.length) : 55;
  const avgRam = servers.length ? Math.round(servers.reduce((a, s) => a + (Number(s.ram) || 50), 0) / servers.length) : 55;
  const offline = servers.filter((s) => s.status === 'offline' || s.status === 'critical').length;
  const idle = servers.filter((s) => Number(s.cpu) < 15).length;
  const openIncidents = incidents.filter((i) => i.status !== 'Resolved').length;

  const optimization = Math.max(30, Math.min(95, Math.round(100 - avgCpu / 2 - offline * 3)));
  const security = Math.max(40, Math.min(95, 90 - openIncidents * 3));
  const reliability = Math.max(35, Math.min(95, 95 - offline * 5 - openIncidents * 2));

  const perf = [
    rec('Rebalance workloads on high-CPU servers', `Average CPU across ${servers.length} server(s) is ${avgCpu}%. Redistribute workloads from top consumers.`, 'High', 'This Week'),
    rec('Enable application caching', 'Introduce a caching layer for the top read-heavy applications.', 'Medium', 'This Month'),
  ];

  const serversByRack = new Map();
  for (const s of servers) {
    if (!s.rack_id) continue;
    serversByRack.set(s.rack_id, (serversByRack.get(s.rack_id) || 0) + 1);
  }

  return {
    scores: {
      optimization, health: reliability, cost_efficiency: Math.max(40, 90 - idle * 4),
      performance: Math.max(30, 100 - avgCpu), reliability, security,
      scalability: Math.max(40, 100 - Math.round((servers.length / Math.max(1, racks.length * 42)) * 100)),
      power_efficiency: Math.max(40, 95 - Math.round(avgCpu / 3)),
      cooling_efficiency: Math.max(40, 95 - Math.round(racks.reduce((a, r) => a + (Number(r.temperature_c) || 22), 0) / Math.max(1, racks.length)) + 22 * 0),
    },
    executive_summary: `Heuristic analysis across ${servers.length} servers, ${racks.length} racks and ${applications.length} applications. Average CPU utilization is ${avgCpu}%, average RAM ${avgRam}%. ${openIncidents} open incident(s). AI provider not configured - findings are pattern-based, not LLM-generated.`,
    categories: {
      performance: perf,
      rack: [rec('Balance rack utilization', 'Redistribute servers between over- and under-utilized racks.', 'High', 'This Month')],
      server: idle > 0
        ? [rec('Consolidate idle servers', `${idle} server(s) are under 15% CPU utilization - consider consolidating.`, 'Medium', 'This Month')]
        : [rec('Monitor server headroom', 'No significantly idle servers detected; continue monitoring utilization trends.', 'Low', 'This Month')],
      storage: [rec('Archive stale datasets', 'Move cold data older than 180 days to archive tier.', 'Medium', 'This Month')],
      incident_prevention: openIncidents > 0
        ? [rec('Resolve open incidents', `${openIncidents} incident(s) currently open - prioritize by severity.`, 'High', 'Immediate')]
        : [rec('Add proactive alerts on CPU saturation', 'Alert when sustained CPU > 85% for 10 minutes.', 'High', 'This Week')],
      cost: [rec('Decommission unused capacity', 'Retire servers idle for 30+ days.', 'High', 'This Month')],
      capacity: [rec('Plan capacity headroom', `Fleet is using ${servers.length} of ~${racks.length * 42} rack units available.`, 'High', 'Immediate')],
      security: [rec('Patch outdated OS', 'Several hosts may run outdated OS versions - audit and patch.', 'High', 'This Week')],
      high_availability: [rec('Add redundancy to single-instance apps', 'Critical applications lack a failover replica.', 'High', 'This Month')],
    },
    cost_savings: {
      monthly_estimate: 1500 + idle * 300 + offline * 200,
      yearly_estimate: (1500 + idle * 300 + offline * 200) * 12,
      breakdown: [
        { area: 'Idle servers', amount: idle * 300 },
        { area: 'Power optimization', amount: 900 },
        { area: 'Storage cleanup', amount: 700 },
        { area: 'Cooling efficiency', amount: 500 },
        { area: 'Offline capacity', amount: offline * 200 },
      ],
    },
    capacity_forecast: {
      horizon: [
        { period: '30d', cpu: avgCpu + 3, memory: avgRam + 4, storage: 68, power: 71 },
        { period: '90d', cpu: avgCpu + 8, memory: avgRam + 10, storage: 78, power: 75 },
        { period: '180d', cpu: avgCpu + 14, memory: avgRam + 16, storage: 88, power: 79 },
        { period: '1y', cpu: avgCpu + 22, memory: avgRam + 24, storage: 96, power: 85 },
      ],
    },
    rack_utilization: racks.slice(0, 8).map((r) => {
      const used = serversByRack.get(r.id) || 0;
      const capacity = Number(r.capacity_u) || 42;
      const current = Math.round((used / capacity) * 100);
      return { rack: r.name, current, projected: Math.min(100, current + 12), temperature: Number(r.temperature_c) || 22 };
    }),
    server_matrix: servers.slice(0, 12).map((s) => ({
      server: s.name || s.hostname || 'server', cpu: Number(s.cpu) || 0, ram: Number(s.ram) || 0, storage: Number(s.storage) || 0, status: s.status || 'healthy',
    })),
    risk_heatmap: [
      { area: 'CPU saturation', risk: Math.min(95, avgCpu + 10), confidence: 78 },
      { area: 'Storage exhaustion', risk: 55, confidence: 72 },
      { area: 'Rack overheating', risk: Math.min(95, Math.round(racks.reduce((a, r) => a + (Number(r.temperature_c) || 22), 0) / Math.max(1, racks.length)) * 2), confidence: 70 },
      { area: 'Single points of failure', risk: offline > 0 ? 70 : 45, confidence: 74 },
      { area: 'Open incidents', risk: Math.min(95, openIncidents * 15), confidence: 80 },
    ],
    radar: [
      { dimension: 'Performance', value: Math.max(30, 100 - avgCpu) }, { dimension: 'Reliability', value: reliability },
      { dimension: 'Security', value: security }, { dimension: 'Scalability', value: Math.max(40, 100 - servers.length) },
      { dimension: 'Cost', value: Math.max(40, 90 - idle * 4) }, { dimension: 'Power', value: Math.max(40, 95 - Math.round(avgCpu / 3)) },
    ],
    timeline: {
      immediate: offline > 0
        ? [rec('Investigate offline/critical servers', `${offline} server(s) are offline or in critical state.`, 'High', 'Immediate')]
        : [rec('Investigate high-CPU servers', 'Triage top servers with sustained high CPU.', 'High', 'Immediate')],
      this_week: perf,
      this_month: [rec('Rebalance rack utilization', 'Move servers to underused racks.', 'Medium', 'This Month')],
      long_term: [rec('Adopt automated capacity planning', 'Introduce ML-driven forecasting.', 'Medium', 'Long-Term')],
    },
  };
}

const REPORT_SHAPE_INSTRUCTIONS = `Return ONLY a JSON object with exactly this shape (no markdown, no commentary):
{
  "scores": {"optimization": number, "health": number, "cost_efficiency": number, "performance": number, "reliability": number, "security": number, "scalability": number, "power_efficiency": number, "cooling_efficiency": number},
  "executive_summary": string,
  "categories": {"performance": [Rec], "rack": [Rec], "server": [Rec], "storage": [Rec], "incident_prevention": [Rec], "cost": [Rec], "capacity": [Rec], "security": [Rec], "high_availability": [Rec]},
  "cost_savings": {"monthly_estimate": number, "yearly_estimate": number, "breakdown": [{"area": string, "amount": number}]},
  "capacity_forecast": {"horizon": [{"period": "30d"|"90d"|"180d"|"1y", "cpu": number, "memory": number, "storage": number, "power": number}]},
  "rack_utilization": [{"rack": string, "current": number, "projected": number, "temperature": number}],
  "server_matrix": [{"server": string, "cpu": number, "ram": number, "storage": number, "status": string}],
  "risk_heatmap": [{"area": string, "risk": number, "confidence": number}],
  "radar": [{"dimension": string, "value": number}],
  "timeline": {"immediate": [Rec], "this_week": [Rec], "this_month": [Rec], "long_term": [Rec]}
}
Where Rec = {"title": string, "description": string, "priority": "High"|"Medium"|"Low", "confidence": number, "effort": "Low"|"Medium"|"High", "business_impact": string, "expected_improvement": string, "responsible_team": string, "timeframe": "Immediate"|"This Week"|"This Month"|"Long-Term"}`;

async function runAiAnalysis({ servers = [], racks = [], applications = [], incidents = [] } = {}) {
  const system = `You are an infrastructure optimization advisor. Analyze the given fleet summary and produce a structured optimization report. ${REPORT_SHAPE_INSTRUCTIONS}`;
  const summary = {
    server_count: servers.length,
    rack_count: racks.length,
    application_count: applications.length,
    open_incidents: incidents.filter((i) => i.status !== 'Resolved').length,
    servers: servers.slice(0, 40).map((s) => ({ name: s.name, cpu: s.cpu, ram: s.ram, storage: s.storage, status: s.status, rack_id: s.rack_id })),
    racks: racks.map((r) => ({ name: r.name, dc: r.dc, capacity_u: r.capacity_u, temperature_c: r.temperature_c })),
    applications: applications.slice(0, 40).map((a) => ({ name: a.name, env: a.env, criticality: a.criticality, status: a.status })),
    recent_incidents: incidents.slice(0, 20).map((i) => ({ title: i.title, severity: i.severity, status: i.status })),
  };
  const prompt = `Fleet data:\n${JSON.stringify(summary, null, 2)}`;
  return ai.completeJson(system, prompt);
}

function answerChatFallback(question, report) {
  if (!report) return 'Run an analysis first so there is a report to discuss.';
  const q = question.toLowerCase();
  if (/cost|save|saving/.test(q)) {
    return `Estimated savings: $${report.cost_savings.monthly_estimate.toLocaleString()}/mo ($${report.cost_savings.yearly_estimate.toLocaleString()}/yr). Top areas: ${report.cost_savings.breakdown.slice(0, 3).map((b) => `${b.area} ($${b.amount})`).join(', ')}.`;
  }
  if (/upgrade|server/.test(q)) {
    const top = [...report.server_matrix].sort((a, b) => b.cpu - a.cpu).slice(0, 3);
    return top.length ? `Highest-load servers:\n${top.map((s) => `- ${s.server}: CPU ${s.cpu}%, RAM ${s.ram}%`).join('\n')}` : 'No server data available.';
  }
  if (/rack|uneven|utilization/.test(q)) {
    const sorted = [...report.rack_utilization].sort((a, b) => b.current - a.current);
    return sorted.length ? `Rack utilization ranges from ${sorted[sorted.length - 1]?.current}% to ${sorted[0]?.current}%. Consider rebalancing servers from ${sorted[0]?.rack} to less-utilized racks.` : 'No rack data available.';
  }
  if (/availab|reliab/.test(q)) return `Reliability score: ${report.scores.reliability}/100. See the High Availability tab for specific actions.`;
  if (/risk/.test(q)) {
    const top = [...report.risk_heatmap].sort((a, b) => b.risk - a.risk).slice(0, 3);
    return top.length ? `Top risk areas:\n${top.map((r) => `- ${r.area}: ${r.risk}% risk (${r.confidence}% confidence)`).join('\n')}` : 'No risk data available.';
  }
  return `${report.executive_summary}\n\n(No AI provider configured - this is a canned response derived from the report, not a live model. Ask about cost, servers, racks, availability, or risk for more detail.)`;
}

async function answerChat({ question, report, history }) {
  if (!ai.isConfigured()) return answerChatFallback(question, report);
  const system = 'You are an infrastructure optimization advisor helping a user understand an optimization report. Answer concisely based on the report.';
  const historyText = (history || []).map((m) => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Report:\n${JSON.stringify(report)}\n\nConversation so far:\n${historyText}\n\nQuestion: ${question}`;
  try {
    return await ai.completeText(system, prompt);
  } catch {
    return answerChatFallback(question, report);
  }
}

module.exports = { runFallbackAnalysis, runAiAnalysis, answerChatFallback, answerChat };
