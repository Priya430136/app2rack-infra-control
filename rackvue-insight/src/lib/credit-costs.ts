// Credit cost per AI feature — matches spec
export const CREDIT_COSTS = {
  ai_chat: 1,
  log_analyzer: 8,
  rca: 12,
  optimization_advisor: 15,
  infrastructure_report: 10,
  capacity_forecast: 7,
  incident_summary: 3,
  natural_language_search: 2,
  diagram_generator: 6,
} as const;

export type FeatureCode = keyof typeof CREDIT_COSTS;

export const FEATURE_LABELS: Record<FeatureCode, string> = {
  ai_chat: "AI Chat",
  log_analyzer: "AI Log Analyzer",
  rca: "Root Cause Analysis",
  optimization_advisor: "Optimization Advisor",
  infrastructure_report: "Infrastructure Report",
  capacity_forecast: "Capacity Forecast",
  incident_summary: "Incident Summary",
  natural_language_search: "Natural Language Search",
  diagram_generator: "Infrastructure Diagram Generator",
};

// Which plan unlocks which premium feature
export const PLAN_FEATURES: Record<string, FeatureCode[]> = {
  free: ["ai_chat", "incident_summary", "natural_language_search"],
  pro: [
    "ai_chat",
    "log_analyzer",
    "rca",
    "optimization_advisor",
    "infrastructure_report",
    "capacity_forecast",
    "incident_summary",
    "natural_language_search",
    "diagram_generator",
  ],
  business: [
    "ai_chat",
    "log_analyzer",
    "rca",
    "optimization_advisor",
    "infrastructure_report",
    "capacity_forecast",
    "incident_summary",
    "natural_language_search",
    "diagram_generator",
  ],
  enterprise: [
    "ai_chat",
    "log_analyzer",
    "rca",
    "optimization_advisor",
    "infrastructure_report",
    "capacity_forecast",
    "incident_summary",
    "natural_language_search",
    "diagram_generator",
  ],
};

export function planHasFeature(plan: string, feature: FeatureCode): boolean {
  return (PLAN_FEATURES[plan] ?? PLAN_FEATURES.free).includes(feature);
}
