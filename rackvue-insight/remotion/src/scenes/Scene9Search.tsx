import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { GlassPanel, enter } from "../components/ui";

const QUERY = "atlas";
const RESULTS = [
  { kind: "Application", name: "Atlas API", meta: "Production · Payments" },
  { kind: "Application", name: "Atlas API", meta: "Production · Web" },
  { kind: "Server", name: "srv-node-1", meta: "Hosts Atlas API" },
];

export const Scene9Search: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const typedChars = Math.min(QUERY.length, Math.max(0, Math.floor((frame - 20) / 4)));
  const overlayOp = interpolate(frame, [5, 18], [0, 1], { extrapolateRight: "clamp" });

  return (
    <AppFrame
      active="Dashboard"
      title="Overview"
      subtitle="Real-time fleet health, utilization & incidents"
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
        [ 07 ] GLOBAL SEARCH
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "rgba(0,0,0,0.55)",
          opacity: overlayOp,
          display: "flex",
          justifyContent: "center",
          paddingTop: 90,
        }}
      >
        <GlassPanel
          style={{
            width: 620,
            height: "fit-content",
            padding: 0,
            overflow: "hidden",
            boxShadow: "0 40px 100px rgba(0,0,0,0.6)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "16px 20px",
              borderBottom: `1px solid ${theme.border}`,
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.mutedForeground}
              strokeWidth={2}
            >
              <circle cx={11} cy={11} r={7} />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <span style={{ fontFamily: body, fontSize: 16, color: theme.foreground }}>
              {QUERY.slice(0, typedChars)}
              <span style={{ opacity: frame % 20 < 10 ? 1 : 0, color: theme.primary }}>|</span>
            </span>
          </div>
          <div style={{ padding: "8px 0" }}>
            {typedChars >= 3 &&
              RESULTS.map((r, i) => {
                const s = enter(frame, 34 + i * 6, fps, 22, 200);
                return (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                      padding: "10px 20px",
                      opacity: s,
                      background: i === 0 ? "oklch(0.78 0.15 200 / 0.1)" : "transparent",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: mono,
                        fontSize: 9.5,
                        color: theme.mutedForeground,
                        border: `1px solid ${theme.border}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        width: 78,
                        textAlign: "center",
                      }}
                    >
                      {r.kind}
                    </span>
                    <span
                      style={{
                        fontFamily: display,
                        fontSize: 14,
                        color: theme.foreground,
                        fontWeight: 500,
                      }}
                    >
                      {r.name}
                    </span>
                    <span
                      style={{ marginLeft: "auto", fontSize: 11.5, color: theme.mutedForeground }}
                    >
                      {r.meta}
                    </span>
                  </div>
                );
              })}
          </div>
        </GlassPanel>
      </div>
    </AppFrame>
  );
};
