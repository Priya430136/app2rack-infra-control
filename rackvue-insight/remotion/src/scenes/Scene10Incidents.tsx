import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, severityColor } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { Badge, GlassPanel, enter } from "../components/ui";

// Matches the real seed templates in server/src/services/infra.service.js
const INCIDENTS = [
  { title: "High CPU on srv-node-33", sev: "Critical", status: "Investigating", downtime: "12m" },
  { title: "Rack temperature spike", sev: "High", status: "Open", downtime: "0m" },
  { title: "5xx error rate elevated on srv-node-13", sev: "High", status: "Resolved", downtime: "7m" },
  { title: "RAM saturation on srv-node-9", sev: "Medium", status: "Resolved", downtime: "0m" },
  { title: "Pod crashloop on srv-node-22", sev: "High", status: "Investigating", downtime: "18m" },
];

export const Scene10Incidents: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame active="Incidents" title="Incidents" subtitle="7 active · severity-graded timeline & downtime tracking">
      <div style={{ fontFamily: mono, color: theme.primary, fontSize: 14, letterSpacing: 4, opacity: kicker, marginBottom: 14 }}>
        [ 08 ] INCIDENT MANAGEMENT
      </div>

      <GlassPanel style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "2.2fr 0.8fr 1fr 0.8fr",
            padding: "12px 22px",
            fontFamily: mono,
            fontSize: 10.5,
            letterSpacing: 1.5,
            color: theme.mutedForeground,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <span>TITLE</span>
          <span>SEVERITY</span>
          <span>STATUS</span>
          <span>DOWNTIME</span>
        </div>
        {INCIDENTS.map((inc, i) => {
          const s = enter(frame, 10 + i * 8, fps, 22, 160);
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "2.2fr 0.8fr 1fr 0.8fr",
                padding: "15px 22px",
                alignItems: "center",
                borderBottom: i < INCIDENTS.length - 1 ? `1px solid ${theme.border}` : "none",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [16, 0])}px)`,
              }}
            >
              <span style={{ fontFamily: display, fontSize: 14, color: theme.foreground }}>{inc.title}</span>
              <span>
                <Badge label={inc.sev} color={severityColor(inc.sev)} solid />
              </span>
              <span
                style={{
                  fontFamily: mono,
                  fontSize: 11,
                  letterSpacing: 1,
                  color: inc.status === "Resolved" ? theme.success : inc.status === "Open" ? theme.destructive : theme.warning,
                  textTransform: "uppercase",
                }}
              >
                {inc.status}
              </span>
              <span style={{ fontFamily: mono, fontSize: 12.5, color: theme.mutedForeground }}>{inc.downtime}</span>
            </div>
          );
        })}
      </GlassPanel>

      <GlassPanel style={{ marginTop: 16, padding: 20, opacity: enter(frame, 70, fps) }}>
        <div style={{ fontFamily: display, fontSize: 13, fontWeight: 600, color: theme.foreground, marginBottom: 12 }}>
          Timeline — High CPU on srv-node-33
        </div>
        <div style={{ display: "flex", gap: 28, position: "relative" }}>
          <div style={{ position: "absolute", top: 6, left: 4, right: 4, height: 2, background: theme.border }} />
          {[
            { t: "12:44", e: "Threshold breach detected" },
            { t: "12:46", e: "Auto-paged on-call SRE" },
            { t: "12:51", e: "Incident opened · Investigating" },
          ].map((step, i) => (
            <div key={i} style={{ position: "relative", flex: 1, opacity: enter(frame, 80 + i * 8, fps) }}>
              <div style={{ width: 10, height: 10, borderRadius: 999, background: theme.chart1, boxShadow: `0 0 10px ${theme.chart1}` }} />
              <div style={{ marginTop: 8, fontFamily: mono, fontSize: 11, color: theme.mutedForeground }}>{step.t}</div>
              <div style={{ fontFamily: body, fontSize: 12.5, color: theme.foreground, marginTop: 2 }}>{step.e}</div>
            </div>
          ))}
        </div>
      </GlassPanel>
    </AppFrame>
  );
};
