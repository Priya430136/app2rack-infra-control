// Produces an RcaReport (see rackvue-insight/src/components/app/rca-panel.tsx
// and the old rackvue-insight/src/lib/rca.functions.ts for the shape) from
// REAL incident/server/rack/metrics context - either via the configured LLM
// or a rule-based heuristic engine used whenever no AI provider is configured.
const ai = require('./ai-provider.service');

function runFallbackAnalysis(ctx) {
  const sev = ctx?.incident?.severity ?? 'Medium';
  const srv = ctx?.server;
  const metrics = ctx?.recent_metrics ?? [];
  const avg = (k) => (metrics.length ? Math.round(metrics.reduce((a, m) => a + (Number(m[k]) || 0), 0) / metrics.length) : 0);
  const avgCpu = avg('cpu');
  const avgRam = avg('ram');
  const avgNet = avg('network');

  let cause = 'Unable to determine — insufficient telemetry';
  const factors = [];
  if (srv?.cpu > 85 || avgCpu > 80) {
    cause = 'Sustained CPU saturation on host';
    factors.push(`CPU ${srv?.cpu}% (24h avg ${avgCpu}%)`);
  } else if (srv?.ram > 90 || avgRam > 85) {
    cause = 'Memory pressure / possible leak';
    factors.push(`RAM ${srv?.ram}% (24h avg ${avgRam}%)`);
  } else if (srv?.storage > 90) {
    cause = 'Storage exhaustion on host volume';
    factors.push(`Disk ${srv?.storage}%`);
  } else if (avgNet > 80) {
    cause = 'Network saturation / upstream congestion';
    factors.push(`Network avg ${avgNet}%`);
  } else if (srv?.status === 'offline') {
    cause = 'Host is offline — hardware, power or network fault';
    factors.push('status=offline');
  } else if (srv?.status === 'critical') {
    cause = 'Host in critical state — degraded service health';
    factors.push('status=critical');
  }

  const confidence = factors.length ? 62 : 35;

  return {
    executive_summary: `Incident on ${srv?.name ?? 'unknown host'} classified ${sev}. AI provider not configured — findings are heuristic and should be validated with live logs.`,
    probable_root_cause: cause,
    confidence,
    affected_components: [srv?.hostname ?? srv?.name, ...(ctx?.linked_applications ?? []).map((a) => a.name)].filter(Boolean),
    reasoning: `Rule-based inspection of the incident context. Server telemetry: ${factors.join('; ') || 'within normal thresholds'}. Rack ${ctx?.rack?.name ?? 'n/a'} in ${ctx?.rack?.dc ?? 'n/a'} reporting ${ctx?.rack?.temperature_c ?? '?'}°C. ${(ctx?.similar_incidents ?? []).length} similar prior incidents recorded. Severity ${sev} escalates urgency of remediation.`,
    immediate_actions: [
      'Verify host reachability via ping/SSH',
      'Inspect top CPU/memory processes and recent deployments',
      'Roll back the last deployment if change-induced',
      'Failover critical applications to a healthy replica',
    ],
    long_term_recommendations: [
      'Add capacity headroom (target <70% steady-state utilization)',
      'Introduce autoscaling / N+1 redundancy for this tier',
      'Improve observability: golden-signal dashboards + alerting',
      'Runbook: document remediation for this failure class',
    ],
    risk_level: sev === 'Critical' || sev === 'High' ? 'High' : sev === 'Medium' ? 'Medium' : 'Low',
    estimated_recovery_min: sev === 'Critical' ? 90 : sev === 'High' ? 45 : 20,
    preventive_measures: [
      'Enable proactive threshold alerts (>80% for 5m)',
      'Schedule quarterly capacity reviews',
      'Chaos-test failover paths monthly',
      'Enforce change-management gates on prod deploys',
    ],
  };
}

const REPORT_SHAPE_INSTRUCTIONS = `Return ONLY a JSON object with exactly this shape (no markdown, no commentary):
{
  "executive_summary": string, "probable_root_cause": string, "confidence": number (0-100),
  "affected_components": string[], "reasoning": string,
  "immediate_actions": string[], "long_term_recommendations": string[],
  "risk_level": "Critical"|"High"|"Medium"|"Low", "estimated_recovery_min": number,
  "preventive_measures": string[]
}`;

async function runAiAnalysis(ctx) {
  const system = `You are an SRE performing root cause analysis on a specific infrastructure incident. Keep every string concise and each array to 3 items maximum. ${REPORT_SHAPE_INSTRUCTIONS}`;
  const prompt = `Incident context:\n${JSON.stringify(ctx, null, 2)}`;
  return ai.completeJson(system, prompt);
}

module.exports = { runFallbackAnalysis, runAiAnalysis };
