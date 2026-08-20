import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { KpiCard, GlassPanel, enter, ProgressBar } from "../components/ui";

const UTIL = [42, 55, 48, 61, 58, 66, 60, 70, 65, 72, 68, 74];

const AreaChart: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps, 26, 100);
  const w = 760;
  const h = 190;
  const pts = UTIL.map((v, i) => [((i / (UTIL.length - 1)) * w), h - (v / 100) * h] as const);
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"} ${p[0]} ${p[1]}`).join(" ");
  const area = `${line} L ${w} ${h} L 0 ${h} Z`;
  return (
    <svg width={w} height={h} style={{ opacity: s }}>
      <defs>
        <linearGradient id="dashArea" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={theme.chart1} stopOpacity={0.45} />
          <stop offset="100%" stopColor={theme.chart1} stopOpacity={0} />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#dashArea)" opacity={s} />
      <path d={line} stroke={theme.chart1} strokeWidth={3} fill="none" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - s} strokeLinecap="round" />
    </svg>
  );
};

const Donut: React.FC<{ delay: number }> = ({ delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps, 20, 120);
  const segments = [
    { v: 50, color: theme.success },
    { v: 33, color: theme.warning },
    { v: 17, color: theme.destructive },
  ];
  const r = 58;
  const c = 2 * Math.PI * r;
  let offset = 0;
  return (
    <svg width={150} height={150} style={{ transform: "rotate(-90deg)", opacity: s }}>
      {segments.map((seg, i) => {
        const len = (seg.v / 100) * c * s;
        const dash = `${len} ${c - len}`;
        const el = (
          <circle key={i} cx={75} cy={75} r={r} stroke={seg.color} strokeWidth={16} fill="none" strokeDasharray={dash} strokeDashoffset={-offset} />
        );
        offset += (seg.v / 100) * c * s;
        return el;
      })}
    </svg>
  );
};

export const Scene3Dashboard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  const loadServers = [
    { name: "srv-node-33", pct: 94 },
    { name: "srv-node-22", pct: 92 },
    { name: "srv-node-11", pct: 90 },
  ];

  return (
    <AppFrame active="Dashboard" title="Overview" subtitle="Real-time fleet health, utilization & incidents">
      <div style={{ fontFamily: mono, color: theme.primary, fontSize: 14, letterSpacing: 4, opacity: kicker, marginBottom: 4 }}>
        [ 01 ] INFRASTRUCTURE DASHBOARD
      </div>

      <GlassPanel style={{ padding: "18px 26px", marginTop: 10, opacity: enter(frame, 4, fps) }}>
        <div style={{ fontFamily: body, fontSize: 12, color: theme.mutedForeground, letterSpacing: 1 }}>WELCOME BACK</div>
        <div style={{ fontFamily: display, fontSize: 24, fontWeight: 600, color: theme.foreground, marginTop: 2 }}>Good afternoon, Priya.</div>
        <div style={{ fontFamily: body, fontSize: 13, color: theme.mutedForeground, marginTop: 4 }}>
          7 active incidents across 36 servers · fleet health 50%
        </div>
      </GlassPanel>

      <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
        <KpiCard label="APPLICATIONS" value="24" sub="8 prod" accent={theme.chart1} delay={12} />
        <KpiCard label="SERVERS" value="36" sub="50% healthy" accent={theme.success} delay={18} />
        <KpiCard label="ACTIVE INCIDENTS" value="7" sub="4 critical" accent={theme.destructive} delay={24} />
        <KpiCard label="RACK UTILIZATION" value="14%" sub="6 racks online" accent={theme.warning} delay={30} />
      </div>

      <div style={{ display: "flex", gap: 16, marginTop: 18 }}>
        <GlassPanel style={{ padding: 22, flex: 1.6 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontFamily: display, fontSize: 15, fontWeight: 600, color: theme.foreground }}>Fleet Utilization · 24h</div>
              <div style={{ fontFamily: body, fontSize: 11.5, color: theme.mutedForeground }}>CPU, memory and network averaged across fleet</div>
            </div>
            <div style={{ display: "flex", gap: 12, fontSize: 11, color: theme.mutedForeground }}>
              <span style={{ color: theme.chart1 }}>● CPU</span>
              <span style={{ color: theme.success }}>● RAM</span>
              <span style={{ color: theme.chart3 }}>● Net</span>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <AreaChart delay={40} />
          </div>
        </GlassPanel>

        <GlassPanel style={{ padding: 22, flex: 1 }}>
          <div style={{ fontFamily: display, fontSize: 15, fontWeight: 600, color: theme.foreground }}>Server Health</div>
          <div style={{ fontFamily: body, fontSize: 11.5, color: theme.mutedForeground }}>Distribution by status</div>
          <div style={{ display: "flex", justifyContent: "center", marginTop: 6 }}>
            <Donut delay={46} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
            {[
              { l: "Healthy", v: 18, c: theme.success },
              { l: "Warning", v: 12, c: theme.warning },
              { l: "Critical", v: 6, c: theme.destructive },
            ].map((r) => (
              <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: theme.mutedForeground }}>
                <span style={{ width: 8, height: 8, borderRadius: 999, background: r.c }} />
                {r.l} <span style={{ marginLeft: "auto", color: theme.foreground, fontWeight: 600 }}>{r.v}</span>
              </div>
            ))}
          </div>
        </GlassPanel>
      </div>

      <GlassPanel style={{ padding: 20, marginTop: 16 }}>
        <div style={{ fontFamily: display, fontSize: 14, fontWeight: 600, color: theme.foreground, marginBottom: 12 }}>Top Server Load</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {loadServers.map((s, i) => (
            <div key={s.name} style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <span style={{ fontFamily: mono, fontSize: 12, color: theme.foreground, width: 110 }}>{s.name}</span>
              <ProgressBar value={s.pct} color={theme.chart1} delay={70 + i * 6} width={480} />
              <span style={{ fontFamily: mono, fontSize: 12, color: theme.mutedForeground }}>{s.pct}%</span>
            </div>
          ))}
        </div>
      </GlassPanel>
    </AppFrame>
  );
};
