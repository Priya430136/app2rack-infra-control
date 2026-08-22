import { interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { GlassPanel, ScoreRing, enter } from "../components/ui";

// Scores below are the ACTUAL output of the rule-based fallback engine
// (server/src/services/optimization-engine.service.js) run against the
// seeded demo fleet (36 servers / 6 racks / 24 applications / 7 open incidents).
const SCORES: { label: string; value: number; color: string }[] = [
  { label: "Optimization", value: 73, color: theme.chart4 },
  { label: "Health", value: 81, color: theme.success },
  { label: "Cost", value: 90, color: theme.chart1 },
  { label: "Performance", value: 45, color: theme.warning },
  { label: "Reliability", value: 81, color: theme.success },
  { label: "Security", value: 69, color: theme.chart1 },
  { label: "Scalability", value: 86, color: theme.chart4 },
  { label: "Power", value: 77, color: theme.warning },
  { label: "Cooling", value: 69, color: theme.chart3 },
];

const RACKS = [
  { name: "A1", current: 14 },
  { name: "A2", current: 14 },
  { name: "B1", current: 14 },
  { name: "B2", current: 14 },
  { name: "C1", current: 14 },
  { name: "C2", current: 14 },
];

const RackBars: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  return (
    <div style={{ display: "flex", alignItems: "flex-end", gap: 18, height: 130 }}>
      {RACKS.map((r, i) => {
        const s = enter(frame, delay + i * 6, 30, 20, 160);
        return (
          <div
            key={r.name}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6 }}
          >
            <div style={{ display: "flex", gap: 3, alignItems: "flex-end", height: 100 }}>
              <div
                style={{
                  width: 14,
                  height: `${r.current * s}%`,
                  background: theme.chart1,
                  borderRadius: 3,
                }}
              />
              <div
                style={{
                  width: 14,
                  height: `${(r.current + 12) * s}%`,
                  background: theme.chart4,
                  borderRadius: 3,
                }}
              />
            </div>
            <span style={{ fontFamily: mono, fontSize: 10, color: theme.mutedForeground }}>
              Rack {r.name}
            </span>
          </div>
        );
      })}
    </div>
  );
};

export const Scene8Optimization: React.FC = () => {
  const frame = useCurrentFrame();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame
      active="AI Optimization Advisor"
      title="AI Optimization Advisor"
      subtitle="Intelligent infrastructure recommendations"
    >
      <div
        style={{
          fontFamily: mono,
          color: theme.primary,
          fontSize: 14,
          letterSpacing: 4,
          opacity: kicker,
          marginBottom: 10,
        }}
      >
        [ 06 ] INFRASTRUCTURE OPTIMIZATION
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16 }}>
        {SCORES.map((s, i) => (
          <GlassPanel
            key={s.label}
            style={{ padding: "14px 10px", flex: 1, display: "flex", justifyContent: "center" }}
          >
            <ScoreRing
              value={s.value}
              label={s.label}
              delay={6 + i * 4}
              size={78}
              color={s.color}
            />
          </GlassPanel>
        ))}
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <GlassPanel style={{ padding: 20, flex: 1, opacity: enter(frame, 55, 30) }}>
          <div
            style={{
              fontFamily: display,
              fontSize: 14,
              fontWeight: 600,
              color: theme.foreground,
              marginBottom: 4,
            }}
          >
            AI Executive Summary
          </div>
          <div
            style={{
              fontFamily: body,
              fontSize: 12.5,
              color: theme.mutedForeground,
              lineHeight: 1.6,
            }}
          >
            Heuristic analysis across 36 servers, 6 racks and 24 applications. Average CPU
            utilization is 55%, average RAM 60%. 7 open incident(s).
          </div>
          <div
            style={{
              marginTop: 16,
              fontFamily: display,
              fontSize: 13,
              fontWeight: 600,
              color: theme.foreground,
            }}
          >
            Rack Utilization — current vs projected
          </div>
          <div style={{ marginTop: 10 }}>
            <RackBars delay={65} />
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: 20, width: 300, opacity: enter(frame, 70, 30) }}>
          <div
            style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: theme.foreground }}
          >
            Cost Savings
          </div>
          <div
            style={{
              fontFamily: display,
              fontSize: 34,
              fontWeight: 700,
              color: theme.success,
              marginTop: 10,
            }}
          >
            $1,500/mo
          </div>
          <div style={{ fontFamily: mono, fontSize: 11, color: theme.mutedForeground }}>
            $18,000 / year potential savings
          </div>
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            {[
              { a: "Idle servers", v: "$0" },
              { a: "Power optimization", v: "$900" },
              { a: "Storage cleanup", v: "$700" },
            ].map((b) => (
              <div
                key={b.a}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: 12,
                  color: theme.mutedForeground,
                }}
              >
                <span>{b.a}</span>
                <span style={{ color: theme.foreground, fontFamily: mono }}>{b.v}</span>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 18,
              fontFamily: display,
              fontSize: 12.5,
              fontWeight: 600,
              color: theme.foreground,
            }}
          >
            Top recommendation
          </div>
          <div
            style={{
              marginTop: 6,
              background: "rgba(255,255,255,0.04)",
              borderRadius: 8,
              padding: 12,
              fontSize: 12,
              color: theme.mutedForeground,
              lineHeight: 1.5,
            }}
          >
            Resolve open incidents — 7 currently open, prioritize by severity.
          </div>
        </GlassPanel>
      </div>
    </AppFrame>
  );
};
