// Produces a LogAnalysisReport (see rackvue-insight/src/lib/log-analyzer.functions.ts
// for the exact shape the frontend renders). Two paths:
//  - runAiAnalysis: sends the logs to the configured LLM and expects back JSON
//    matching the same shape.
//  - runFallbackAnalysis: a real regex/heuristic parser used whenever no AI
//    provider is configured, so the feature works with zero external setup.
const ai = require('./ai-provider.service');

const CATEGORY_PATTERNS = [
  { name: 'Database', re: /\b(db|database|sql|postgres|mysql|query|connection pool|deadlock)\b/i },
  { name: 'Network', re: /\b(timeout|timed out|connection refused|dns|network|latency|unreachable|502|503|504)\b/i },
  { name: 'Application', re: /\b(exception|nullpointer|undefined|crash|panic|stack ?trace)\b/i },
  { name: 'Infrastructure', re: /\b(disk|memory|oom|out of memory|cpu|rack|temperature|overheat)\b/i },
  { name: 'Security', re: /\b(auth|401|403|unauthorized|forbidden|ssl|cert|token)\b/i },
];

function classifySeverity(line) {
  if (/\b(critical|fatal|panic)\b/i.test(line)) return 'CRITICAL';
  if (/\b(error|exception|failed)\b/i.test(line)) return 'ERROR';
  if (/\bwarn/i.test(line)) return 'WARNING';
  if (/\bdebug\b/i.test(line)) return 'DEBUG';
  if (/\binfo\b/i.test(line)) return 'INFO';
  return null;
}

function extractHour(line, index, totalLines) {
  const m = line.match(/(\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}|(?<![\d:])\d{2}:\d{2}(?::\d{2})?)/);
  if (m) {
    const timePart = m[0].split(/[ T]/).pop();
    return timePart.slice(0, 2);
  }
  // No timestamps in the log - spread lines evenly across a synthetic 24h window.
  return String(Math.floor((index / Math.max(1, totalLines)) * 24)).padStart(2, '0');
}

function extractTimestamp(line) {
  const m = line.match(/\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(:\d{2})?|\d{2}:\d{2}:\d{2}/);
  return m ? m[0] : null;
}

function uniqueCapped(arr, n) {
  return Array.from(new Set(arr)).slice(0, n);
}

function runFallbackAnalysis(logs, { title, existingIncidents = [] } = {}) {
  const lines = logs.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const total = lines.length || 1;

  const bySeverity = { CRITICAL: [], ERROR: [], WARNING: [], INFO: [], DEBUG: [] };
  lines.forEach((l, i) => {
    const sev = classifySeverity(l);
    if (sev) bySeverity[sev].push({ line: l, index: i });
  });

  const totalErrors = bySeverity.ERROR.length + bySeverity.CRITICAL.length;
  const warnings = bySeverity.WARNING.length;
  const criticalEvents = bySeverity.CRITICAL.length;

  const exceptionTokens = [];
  for (const l of lines) {
    const matches = l.match(/\b([A-Z][a-zA-Z]*(?:Exception|Error))\b/g);
    if (matches) exceptionTokens.push(...matches);
  }
  const uniqueExceptions = new Set(exceptionTokens).size;

  const normalized = (l) => l.replace(/\d+/g, '#').replace(/\s+/g, ' ').trim();
  const seen = new Map();
  for (const { line } of [...bySeverity.CRITICAL, ...bySeverity.ERROR]) {
    const key = normalized(line);
    seen.set(key, (seen.get(key) || 0) + 1);
  }
  const repeatedErrors = Array.from(seen.values()).filter((c) => c > 1).reduce((a, c) => a + c, 0);

  // Timeline - most significant lines first (critical, then error), capped.
  const significant = [...bySeverity.CRITICAL, ...bySeverity.ERROR, ...bySeverity.WARNING].slice(0, 8);
  const timeline = significant
    .sort((a, b) => a.index - b.index)
    .map(({ line, index }) => ({
      time: extractTimestamp(line) || `line ${index + 1}`,
      event: line.trim().slice(0, 180),
    }));

  // Hourly frequency of error/critical events.
  const hourCounts = {};
  for (const { line, index } of [...bySeverity.CRITICAL, ...bySeverity.ERROR]) {
    const h = extractHour(line, index, total);
    hourCounts[h] = (hourCounts[h] || 0) + 1;
  }
  const hourlyFrequency = Object.keys(hourCounts)
    .sort()
    .map((h) => ({ hour: `${h}:00`, count: hourCounts[h] }));

  const severityBreakdown = Object.entries(bySeverity)
    .filter(([, v]) => v.length > 0)
    .map(([name, v]) => ({ name: name.charAt(0) + name.slice(1).toLowerCase(), value: v.length }));

  // Category detection across error/warning/critical lines.
  const flagged = [...bySeverity.CRITICAL, ...bySeverity.ERROR, ...bySeverity.WARNING].map((x) => x.line);
  const categoryCounts = {};
  for (const l of flagged) {
    for (const cat of CATEGORY_PATTERNS) {
      if (cat.re.test(l)) categoryCounts[cat.name] = (categoryCounts[cat.name] || 0) + 1;
    }
  }
  const flaggedTotal = Object.values(categoryCounts).reduce((a, b) => a + b, 0);
  const errorCategories = flaggedTotal > 0
    ? Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([category, count]) => ({ category, percent: Math.round((count / flaggedTotal) * 100) }))
    : [{ category: 'General', percent: 100 }];
  const topCategory = errorCategories[0]?.category ?? 'General';

  // Affected infrastructure - pattern-match common naming conventions.
  const servers = uniqueCapped(logs.match(/\b(srv-[\w-]+|web-\d+|node\d+|[\w-]+\.app2rack\.io)\b/gi) ?? [], 8);
  const containers = uniqueCapped(logs.match(/\b(pod|container)[\s/-]?[\w-]*\b/gi) ?? [], 6);
  const databases = uniqueCapped(logs.match(/\b(postgres|postgresql|mysql|redis|mongo(?:db)?)\b/gi) ?? [], 6);
  const racks = uniqueCapped(logs.match(/\b(rack[\s-]?[a-z0-9]+|RK-\d+|R-\d+)\b/gi) ?? [], 6);
  const services = uniqueCapped(logs.match(/\b([\w-]+(?:-api|-service|-gateway|-worker))\b/gi) ?? [], 8);
  const applications = uniqueCapped(logs.match(/\b([A-Z][a-z]+ (?:API|Service|Gateway|Worker))\b/g) ?? [], 6);

  let severity = 'Low';
  if (criticalEvents > 0) severity = 'Critical';
  else if (totalErrors > 10) severity = 'High';
  else if (totalErrors > 0 || warnings > 5) severity = 'Medium';

  const confidence = Math.max(40, Math.min(80, 45 + totalErrors * 2 + criticalEvents * 5));

  const recommendations = { immediate: [], short_term: [], long_term: [], preventive: [] };
  if (criticalEvents > 0) {
    recommendations.immediate.push({ action: `Triage the ${criticalEvents} critical event(s) immediately - service impact is likely.`, priority: 'High', effort: 'Low', impact: 'High' });
  }
  if (categoryCounts.Database) {
    recommendations.immediate.push({ action: 'Check database connection pool size and active connection count.', priority: 'High', effort: 'Low', impact: 'High' });
    recommendations.short_term.push({ action: 'Review slow query log and add indexes for repeated slow queries.', priority: 'Medium', effort: 'Medium', impact: 'Medium' });
  }
  if (categoryCounts.Network) {
    recommendations.immediate.push({ action: 'Verify upstream/downstream connectivity and DNS resolution.', priority: 'High', effort: 'Low', impact: 'Medium' });
  }
  if (categoryCounts.Security) {
    recommendations.immediate.push({ action: 'Audit recent auth failures for credential stuffing or expired certs/tokens.', priority: 'High', effort: 'Low', impact: 'High' });
  }
  if (categoryCounts.Infrastructure) {
    recommendations.short_term.push({ action: 'Check resource utilization (CPU/memory/disk) on affected hosts.', priority: 'Medium', effort: 'Low', impact: 'Medium' });
  }
  if (repeatedErrors > 3) {
    recommendations.short_term.push({ action: 'Deduplicate repeated errors and add alerting to catch this pattern earlier next time.', priority: 'Medium', effort: 'Medium', impact: 'Medium' });
  }
  recommendations.long_term.push({ action: 'Add structured logging (JSON) with correlation IDs to speed up future triage.', priority: 'Low', effort: 'High', impact: 'Medium' });
  recommendations.preventive.push({ action: 'Add automated alerts for the error patterns detected in this analysis.', priority: 'Medium', effort: 'Medium', impact: 'High' });
  if (recommendations.immediate.length === 0) {
    recommendations.immediate.push({ action: 'No critical issues detected - continue routine monitoring.', priority: 'Low', effort: 'Low', impact: 'Low' });
  }

  const suggestedCommands = [];
  if (totalErrors > 0) suggestedCommands.push({ label: 'Find all error lines', command: `grep -iE "error|exception|critical" ${title ? title.replace(/[^\w.-]/g, '_') : 'app'}.log` });
  if (servers.length > 0) suggestedCommands.push({ label: `Check status of ${servers[0]}`, command: `systemctl status ${servers[0]}` });
  if (categoryCounts.Database) suggestedCommands.push({ label: 'Check DB connections', command: 'SELECT count(*) FROM pg_stat_activity;' });
  suggestedCommands.push({ label: 'Tail live logs', command: 'tail -f -n 200 /var/log/app/current.log' });

  const similarIncidents = existingIncidents
    .filter((inc) => inc.severity === severity || (inc.title || '').toLowerCase().includes(topCategory.toLowerCase()))
    .slice(0, 3)
    .map((inc) => ({
      id: String(inc.id).slice(0, 8),
      title: inc.title,
      severity: inc.severity,
      similarity: inc.severity === severity ? 72 : 55,
    }));

  const executiveSummary = `Analyzed ${lines.length} log line(s): ${totalErrors} error(s) (${criticalEvents} critical), ${warnings} warning(s), ${uniqueExceptions} unique exception type(s). Dominant issue category: ${topCategory}. AI provider not configured - this is a pattern-based (rule-engine) analysis.`;
  const probableRootCause = totalErrors === 0
    ? 'No errors detected in the supplied logs - system appears to be operating normally.'
    : `Recurring ${topCategory.toLowerCase()} issues account for the majority of flagged log lines, consistent with ${criticalEvents > 0 ? 'an active service-impacting incident' : 'a degraded but non-critical condition'}.`;
  const reasoning = `Classification is based on keyword/pattern matching (severity markers, exception names, and known infra naming conventions) rather than semantic understanding, so treat this as a first-pass triage aid, not a definitive diagnosis. ${errorCategories.map((c) => `${c.category} ${c.percent}%`).join(', ')}.`;

  const applicationsAffected = applications.length || (totalErrors > 0 ? 1 : 0);
  const potentialDowntime = criticalEvents * 8 + Math.min(30, totalErrors);

  return {
    executive_summary: executiveSummary,
    probable_root_cause: probableRootCause,
    confidence,
    severity,
    risk_level: severity,
    reasoning,
    error_summary: {
      total_errors: totalErrors,
      warnings,
      critical_events: criticalEvents,
      repeated_errors: repeatedErrors,
      unique_exceptions: uniqueExceptions,
    },
    timeline,
    affected_infrastructure: { applications, servers, racks, services, databases, containers },
    error_categories: errorCategories,
    similar_incidents: similarIncidents,
    recommendations,
    suggested_commands: suggestedCommands,
    business_impact: {
      applications_affected: applicationsAffected,
      potential_downtime_min: potentialDowntime,
      customer_impact: severity === 'Critical' ? 'High - active user-facing impact likely' : severity === 'High' ? 'Moderate - some users may be affected' : 'Low - unlikely to be user-visible',
      risk_level: severity,
      sla_impact: criticalEvents > 0 ? 'At risk' : 'None expected',
      revenue_risk: severity === 'Critical' ? 'Elevated' : 'Low',
    },
    executive_report: `${executiveSummary}\n\n${probableRootCause}\n\nRecommended next step: ${recommendations.immediate[0]?.action ?? 'Continue monitoring.'}`,
    visualizations: {
      hourly_frequency: hourlyFrequency.length ? hourlyFrequency : [{ hour: '00:00', count: 0 }],
      severity_breakdown: severityBreakdown.length ? severityBreakdown : [{ name: 'Info', value: 1 }],
    },
  };
}

const REPORT_SHAPE_INSTRUCTIONS = `Return ONLY a JSON object with exactly this shape (no markdown, no commentary):
{
  "executive_summary": string, "probable_root_cause": string, "confidence": number (0-100),
  "severity": "Critical"|"High"|"Medium"|"Low", "risk_level": "Critical"|"High"|"Medium"|"Low", "reasoning": string,
  "error_summary": {"total_errors": number, "warnings": number, "critical_events": number, "repeated_errors": number, "unique_exceptions": number},
  "timeline": [{"time": string, "event": string}],
  "affected_infrastructure": {"applications": string[], "servers": string[], "racks": string[], "services": string[], "databases": string[], "containers": string[]},
  "error_categories": [{"category": string, "percent": number}],
  "similar_incidents": [{"id": string, "title": string, "severity": string, "similarity": number}],
  "recommendations": {"immediate": [{"action": string, "priority": string, "effort": string, "impact": string}], "short_term": [...], "long_term": [...], "preventive": [...]},
  "suggested_commands": [{"label": string, "command": string}],
  "business_impact": {"applications_affected": number, "potential_downtime_min": number, "customer_impact": string, "risk_level": string, "sla_impact": string, "revenue_risk": string},
  "executive_report": string,
  "visualizations": {"hourly_frequency": [{"hour": string, "count": number}], "severity_breakdown": [{"name": string, "value": number}]}
}`;

async function runAiAnalysis(logs, { title } = {}) {
  const system = `You are an SRE log analysis assistant. Analyze the provided log excerpt and produce a structured incident report. ${REPORT_SHAPE_INSTRUCTIONS}`;
  const prompt = `Title: ${title || 'Log analysis'}\n\nLogs:\n${logs.slice(0, 16000)}`;
  return ai.completeJson(system, prompt);
}

function answerChatFallback(question, report) {
  if (!report) return 'Run an analysis first so there is a report to discuss.';
  const q = question.toLowerCase();
  if (/why|cause|root/.test(q)) return `Probable root cause: ${report.probable_root_cause}\n\n${report.reasoning}`;
  if (/prevent|avoid/.test(q)) {
    const items = report.recommendations?.preventive ?? [];
    return items.length ? `Preventive steps:\n${items.map((r) => `- ${r.action}`).join('\n')}` : 'No preventive recommendations were generated for this analysis.';
  }
  if (/database|db|sql/.test(q)) {
    const cat = report.error_categories?.find((c) => /database/i.test(c.category));
    return cat ? `Database-related issues account for ${cat.percent}% of flagged log lines.` : 'No database-related issues were detected in this log.';
  }
  if (/monitor|watch|next/.test(q)) {
    const items = [...(report.recommendations?.immediate ?? []), ...(report.recommendations?.short_term ?? [])];
    return items.length ? `Suggested monitoring focus:\n${items.slice(0, 3).map((r) => `- ${r.action}`).join('\n')}` : 'Continue standard monitoring - no specific hotspots identified.';
  }
  return `${report.executive_summary}\n\nAsk about "root cause", "prevention", or a category like database/network for more detail. (No AI provider configured - this is a canned response derived from the report, not a live model.)`;
}

async function answerChat({ question, logs, report, history }) {
  if (!ai.isConfigured()) return answerChatFallback(question, report);
  const system = 'You are an SRE assistant helping a user understand a log analysis report. Answer concisely based on the report and, if needed, the raw logs.';
  const historyText = (history || []).map((m) => `${m.role}: ${m.content}`).join('\n');
  const prompt = `Report:\n${JSON.stringify(report)}\n\nRaw logs (may be truncated):\n${(logs || '').slice(0, 8000)}\n\nConversation so far:\n${historyText}\n\nQuestion: ${question}`;
  try {
    return await ai.completeText(system, prompt);
  } catch {
    return answerChatFallback(question, report);
  }
}

module.exports = { runFallbackAnalysis, runAiAnalysis, answerChatFallback, answerChat };
