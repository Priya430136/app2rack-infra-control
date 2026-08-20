import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme, statusColor } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { Badge, GlassPanel, enter, ProgressBar } from "../components/ui";

const SERVERS = [
  { name: "srv-node-1", host: "node1.app2rack.io", os: "Ubuntu 22.04", cpu: 26, ram: 41, storage: 38, status: "healthy" },
  { name: "srv-node-9", host: "node9.app2rack.io", os: "RHEL 9", cpu: 83, ram: 76, storage: 61, status: "critical" },
  { name: "srv-node-13", host: "node13.app2rack.io", os: "Debian 12", cpu: 29, ram: 55, storage: 44, status: "warning" },
  { name: "srv-node-22", host: "node22.app2rack.io", os: "Rocky Linux 9", cpu: 69, ram: 62, storage: 57, status: "healthy" },
  { name: "srv-node-33", host: "node33.app2rack.io", os: "Windows Server 2022", cpu: 94, ram: 88, storage: 72, status: "critical" },
];

const Meter: React.FC<{ label: string; value: number; color: string; delay: number }> = ({ label, value, color, delay }) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 4, width: 130 }}>
    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: theme.mutedForeground, fontFamily: mono }}>
      <span>{label}</span>
      <span>{value}%</span>
    </div>
    <ProgressBar value={value} color={color} delay={delay} width={130} />
  </div>
);

export const Scene5Servers: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame active="Servers" title="Server Inventory" subtitle="36 servers · CPU, RAM & storage utilization">
      <div style={{ fontFamily: mono, color: theme.primary, fontSize: 14, letterSpacing: 4, opacity: kicker, marginBottom: 14 }}>
        [ 03 ] SERVER FLEET
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {SERVERS.map((s, i) => {
          const en = enter(frame, 10 + i * 10, fps, 22, 150);
          return (
            <GlassPanel
              key={s.name}
              style={{
                padding: "16px 22px",
                display: "flex",
                alignItems: "center",
                gap: 24,
                opacity: en,
                transform: `translateY(${interpolate(en, [0, 1], [16, 0])}px)`,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 10, width: 210 }}>
                <span style={{ width: 9, height: 9, borderRadius: 999, background: statusColor(s.status), boxShadow: `0 0 8px ${statusColor(s.status)}` }} />
                <div>
                  <div style={{ fontFamily: display, fontSize: 15, fontWeight: 600, color: theme.foreground }}>{s.name}</div>
                  <div style={{ fontFamily: mono, fontSize: 10.5, color: theme.mutedForeground }}>{s.host}</div>
                </div>
              </div>
              <div style={{ width: 150, fontSize: 12, color: theme.mutedForeground, fontFamily: body }}>{s.os}</div>
              <Meter label="CPU" value={s.cpu} color={theme.chart1} delay={20 + i * 10} />
              <Meter label="RAM" value={s.ram} color={theme.success} delay={24 + i * 10} />
              <Meter label="STORAGE" value={s.storage} color={theme.chart4} delay={28 + i * 10} />
              <div style={{ marginLeft: "auto" }}>
                <Badge label={s.status.toUpperCase()} color={statusColor(s.status)} />
              </div>
            </GlassPanel>
          );
        })}
      </div>
    </AppFrame>
  );
};
