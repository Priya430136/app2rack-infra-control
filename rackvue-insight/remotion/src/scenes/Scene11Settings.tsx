import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { GlassPanel, enter } from "../components/ui";

// Faithfully recreates the real Settings page (Profile / Notifications / Integrations cards).
const NOTIFS: [string, boolean][] = [
  ["Critical incidents", true],
  ["Server downtime", true],
  ["High CPU alerts", true],
  ["Rack temperature warnings", true],
  ["Deployment events", false],
  ["Weekly summary email", true],
];

const INTEGRATIONS = ["Prometheus", "Grafana", "PagerDuty", "Slack", "Datadog", "ServiceNow"];

const Toggle: React.FC<{ on: boolean }> = ({ on }) => (
  <div
    style={{
      width: 34,
      height: 19,
      borderRadius: 999,
      background: on ? theme.primary : "rgba(255,255,255,0.12)",
      position: "relative",
    }}
  >
    <div
      style={{
        position: "absolute",
        top: 2,
        left: on ? 17 : 2,
        width: 15,
        height: 15,
        borderRadius: 999,
        background: theme.foreground,
      }}
    />
  </div>
);

export const Scene11Settings: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame
      active="Settings"
      title="Settings"
      subtitle="Profile, notifications & connected systems"
    >
      <div
        style={{
          fontFamily: mono,
          color: theme.primary,
          fontSize: 14,
          letterSpacing: 4,
          opacity: kicker,
          marginBottom: 14,
        }}
      >
        [ 09 ] ADMINISTRATION
      </div>

      <div style={{ display: "flex", gap: 16 }}>
        <GlassPanel style={{ padding: 22, flex: 1, opacity: enter(frame, 8, fps) }}>
          <div
            style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: theme.foreground }}
          >
            Profile
          </div>
          <div style={{ fontSize: 11.5, color: theme.mutedForeground, marginBottom: 14 }}>
            Your operations identity
          </div>
          {[
            { l: "Display Name", v: "Priya Skand" },
            { l: "Email", v: "priya@app2rack.io" },
            { l: "Role", v: "Infrastructure Lead" },
          ].map((f) => (
            <div key={f.l} style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 10.5, color: theme.mutedForeground, marginBottom: 4 }}>
                {f.l}
              </div>
              <div
                style={{
                  border: `1px solid ${theme.border}`,
                  borderRadius: 8,
                  padding: "9px 12px",
                  fontSize: 13,
                  color: theme.foreground,
                }}
              >
                {f.v}
              </div>
            </div>
          ))}
        </GlassPanel>

        <GlassPanel style={{ padding: 22, flex: 1, opacity: enter(frame, 20, fps) }}>
          <div
            style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: theme.foreground }}
          >
            Notifications
          </div>
          <div style={{ fontSize: 11.5, color: theme.mutedForeground, marginBottom: 14 }}>
            Alert routing preferences
          </div>
          {NOTIFS.map(([label, on], i) => {
            const s = enter(frame, 26 + i * 6, fps, 24, 200);
            return (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 12,
                  opacity: s,
                }}
              >
                <span style={{ fontSize: 12.5, color: theme.foreground }}>{label}</span>
                <Toggle on={on} />
              </div>
            );
          })}
        </GlassPanel>

        <GlassPanel style={{ padding: 22, flex: 1, opacity: enter(frame, 30, fps) }}>
          <div
            style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: theme.foreground }}
          >
            Integrations
          </div>
          <div style={{ fontSize: 11.5, color: theme.mutedForeground, marginBottom: 14 }}>
            Connected systems
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {INTEGRATIONS.map((n, i) => {
              const s = enter(frame, 36 + i * 5, fps, 24, 200);
              return (
                <div
                  key={n}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    border: `1px solid ${theme.border}`,
                    borderRadius: 8,
                    padding: "9px 14px",
                    opacity: s,
                  }}
                >
                  <span style={{ fontSize: 12.5, color: theme.foreground }}>{n}</span>
                  <span
                    style={{ width: 7, height: 7, borderRadius: 999, background: theme.success }}
                  />
                </div>
              );
            })}
          </div>
        </GlassPanel>
      </div>
    </AppFrame>
  );
};
