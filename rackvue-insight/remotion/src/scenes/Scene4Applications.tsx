import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, severityColor, statusColor } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { Badge, GlassPanel, enter, Cursor } from "../components/ui";

const APPS = [
  {
    name: "Atlas API",
    owner: "Payments",
    env: "Production",
    crit: "Critical",
    dep: "Kubernetes",
    server: "srv-node-1",
    status: "healthy",
  },
  {
    name: "Atlas API",
    owner: "Web",
    env: "Production",
    crit: "Critical",
    dep: "Kubernetes",
    server: "srv-node-13",
    status: "warning",
  },
  {
    name: "Cipher Service",
    owner: "Identity",
    env: "Production",
    crit: "High",
    dep: "Docker",
    server: "srv-node-10",
    status: "healthy",
  },
  {
    name: "Cipher Service",
    owner: "Mobile",
    env: "Production",
    crit: "High",
    dep: "Docker",
    server: "srv-node-22",
    status: "healthy",
  },
  {
    name: "Echo Gateway",
    owner: "DevOps",
    env: "UAT",
    crit: "Medium",
    dep: "Bare Metal",
    server: "srv-node-23",
    status: "healthy",
  },
  {
    name: "Helios Worker",
    owner: "Platform",
    env: "UAT",
    crit: "Medium",
    dep: "VM",
    server: "srv-node-9",
    status: "critical",
  },
];

export const Scene4Applications: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame active="Applications" title="Applications" subtitle="24 applications">
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
        [ 02 ] APPLICATION INVENTORY
      </div>

      <div
        style={{ display: "flex", alignItems: "center", gap: 12, opacity: enter(frame, 6, fps) }}
      >
        <div
          style={{
            flex: 1,
            border: `1px solid ${theme.border}`,
            borderRadius: 8,
            padding: "10px 14px",
            color: theme.mutedForeground,
            fontSize: 13,
          }}
        >
          Search by name or owner…
        </div>
        {["All", "Production", "UAT", "Dev"].map((f, i) => (
          <div
            key={f}
            style={{
              padding: "9px 16px",
              borderRadius: 8,
              fontSize: 13,
              fontFamily: mono,
              background: i === 0 ? theme.primary : "transparent",
              color: i === 0 ? theme.background : theme.mutedForeground,
              border: i === 0 ? "none" : `1px solid ${theme.border}`,
            }}
          >
            {f}
          </div>
        ))}
        <div
          style={{
            marginLeft: "auto",
            padding: "10px 18px",
            borderRadius: 8,
            background: theme.gradient,
            color: theme.background,
            fontFamily: display,
            fontWeight: 600,
            fontSize: 13,
          }}
        >
          + New App
        </div>
      </div>

      <GlassPanel style={{ marginTop: 16, padding: 0, overflow: "hidden" }}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1fr",
            padding: "12px 22px",
            fontFamily: mono,
            fontSize: 10.5,
            letterSpacing: 1.5,
            color: theme.mutedForeground,
            borderBottom: `1px solid ${theme.border}`,
          }}
        >
          <span>NAME</span>
          <span>OWNER</span>
          <span>ENV</span>
          <span>CRITICALITY</span>
          <span>DEPLOYMENT</span>
          <span>SERVER</span>
        </div>
        {APPS.map((a, i) => {
          const s = enter(frame, 16 + i * 7, fps, 22, 150);
          return (
            <div
              key={i}
              style={{
                display: "grid",
                gridTemplateColumns: "1.6fr 1fr 1fr 1fr 1fr 1fr",
                padding: "14px 22px",
                alignItems: "center",
                borderBottom: i < APPS.length - 1 ? `1px solid ${theme.border}` : "none",
                opacity: s,
                transform: `translateX(${interpolate(s, [0, 1], [16, 0])}px)`,
              }}
            >
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontFamily: display,
                  fontSize: 14,
                  color: theme.foreground,
                  fontWeight: 500,
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: statusColor(a.status),
                  }}
                />
                {a.name}
              </span>
              <span style={{ fontSize: 13, color: theme.mutedForeground }}>{a.owner}</span>
              <span>
                <Badge
                  label={a.env}
                  color={a.env === "Production" ? theme.success : theme.warning}
                />
              </span>
              <span>
                <Badge label={a.crit} color={severityColor(a.crit)} solid />
              </span>
              <span style={{ fontSize: 13, color: theme.mutedForeground, fontFamily: mono }}>
                {a.dep}
              </span>
              <span style={{ fontSize: 13, color: theme.mutedForeground, fontFamily: mono }}>
                {a.server}
              </span>
            </div>
          );
        })}
      </GlassPanel>
      <Cursor from={[900, 40]} to={[80, 96]} delay={10} clickAt={30} />
    </AppFrame>
  );
};
