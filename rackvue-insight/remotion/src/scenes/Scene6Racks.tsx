import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { GlassPanel, enter } from "../components/ui";

type Slot = { u: number; server: string; pct: number } | null;

const RACK_A1: Slot[] = Array.from({ length: 14 }, (_, i) => null);
[[13, "srv-node-13", 29], [11, "srv-node-25", 38], [7, "srv-node-7", 62], [5, "srv-node-19", 71], [3, "srv-node-31", 80], [1, "srv-node-1", 26]].forEach(
  ([u, s, p]: any) => (RACK_A1[14 - u] = { u, server: s, pct: p }),
);

const RACK_A2: Slot[] = Array.from({ length: 14 }, (_, i) => null);
[[14, "srv-node-14", 36], [12, "srv-node-26", 45], [8, "srv-node-8", 69], [6, "srv-node-20", 78], [4, "srv-node-32", 87], [2, "srv-node-2", 27]].forEach(
  ([u, s, p]: any) => (RACK_A2[14 - u] = { u, server: s, pct: p }),
);

const RackColumn: React.FC<{ name: string; dc: string; temp: string; slots: Slot[]; delay: number; warm?: boolean }> = ({
  name,
  dc,
  temp,
  slots,
  delay,
  warm,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps, 22, 140);
  return (
    <GlassPanel style={{ padding: 20, flex: 1, opacity: s, transform: `translateY(${interpolate(s, [0, 1], [20, 0])}px)` }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <div>
          <div style={{ fontFamily: display, fontSize: 17, fontWeight: 600, color: theme.foreground }}>{name}</div>
          <div style={{ fontFamily: mono, fontSize: 10.5, color: theme.mutedForeground }}>{dc}</div>
        </div>
        <div style={{ fontFamily: mono, fontSize: 13, color: warm ? theme.warning : theme.success }}>{temp}°C</div>
      </div>
      <div style={{ marginTop: 4, fontSize: 11, color: theme.mutedForeground, fontFamily: mono }}>Capacity 6 / 42 U · 14%</div>
      <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 3 }}>
        {slots.map((slot, i) => {
          const rowDelay = delay + 14 + i * 3;
          const rowS = enter(frame, rowDelay, fps, 26, 180);
          return (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                height: 20,
                opacity: rowS,
                background: slot ? "oklch(0.78 0.15 200 / 0.1)" : "transparent",
                border: slot ? `1px solid oklch(0.78 0.15 200 / 0.3)` : `1px solid transparent`,
                borderRadius: 4,
                padding: "0 8px",
              }}
            >
              <span style={{ fontFamily: mono, fontSize: 9, color: theme.mutedForeground, width: 20 }}>U{14 - i}</span>
              {slot ? (
                <>
                  <span style={{ fontFamily: mono, fontSize: 10.5, color: theme.foreground }}>{slot.server}</span>
                  <span style={{ marginLeft: "auto", fontFamily: mono, fontSize: 10, color: theme.chart1 }}>{slot.pct}%</span>
                </>
              ) : (
                <span style={{ fontSize: 9.5, color: theme.mutedForeground, opacity: 0.5 }}>empty</span>
              )}
            </div>
          );
        })}
      </div>
    </GlassPanel>
  );
};

export const Scene6Racks: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame active="Racks" title="Rack Management" subtitle="6 racks across 3 data centers">
      <div style={{ fontFamily: mono, color: theme.primary, fontSize: 14, letterSpacing: 4, opacity: kicker, marginBottom: 14 }}>
        [ 04 ] RACK VISUALIZATION
      </div>
      <div style={{ display: "flex", gap: 16 }}>
        <RackColumn name="Rack A1" dc="DC-EAST-01" temp="21.0" slots={RACK_A1} delay={10} />
        <RackColumn name="Rack A2" dc="DC-WEST-02" temp="28.7" slots={RACK_A2} delay={20} warm />
        <div style={{ flex: 1, opacity: enter(frame, 40, fps) }}>
          <GlassPanel style={{ padding: 22, height: "100%", display: "flex", flexDirection: "column", justifyContent: "center", gap: 18 }}>
            <div style={{ fontFamily: display, fontSize: 16, fontWeight: 600, color: theme.foreground }}>Fleet Capacity</div>
            {[
              { l: "Rack A1", v: 14 },
              { l: "Rack A2", v: 14 },
              { l: "Rack B1", v: 14 },
              { l: "Rack B2", v: 14 },
              { l: "Rack C1", v: 14 },
              { l: "Rack C2", v: 14 },
            ].map((r) => (
              <div key={r.l} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <span style={{ fontFamily: mono, fontSize: 11, color: theme.mutedForeground, width: 60 }}>{r.l}</span>
                <div style={{ flex: 1, height: 6, borderRadius: 999, background: "rgba(255,255,255,0.08)" }}>
                  <div style={{ width: `${r.v}%`, height: "100%", borderRadius: 999, background: theme.gradient }} />
                </div>
                <span style={{ fontFamily: mono, fontSize: 11, color: theme.foreground }}>{r.v}%</span>
              </div>
            ))}
          </GlassPanel>
        </div>
      </div>
    </AppFrame>
  );
};
