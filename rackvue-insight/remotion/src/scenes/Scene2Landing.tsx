import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, body } from "../fonts";

// Recreates the real landing page hero (rackvue-insight/src/routes/index.tsx)
export const Scene2Landing: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badge = spring({ frame, fps, config: { damping: 18 } });
  const h1 = interpolate(frame, [8, 28], [0, 1], { extrapolateRight: "clamp" });
  const h1y = interpolate(frame, [8, 28], [20, 0], { extrapolateRight: "clamp" });
  const sub = interpolate(frame, [24, 44], [0, 1], { extrapolateRight: "clamp" });
  const cta = interpolate(frame, [40, 58], [0, 1], { extrapolateRight: "clamp" });
  const scale = interpolate(frame, [0, 150], [1, 1.06], { extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: theme.background, alignItems: "center", justifyContent: "center", transform: `scale(${scale})` }}>
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1100px 700px at 30% 20%, oklch(0.78 0.15 200 / 0.16), transparent 60%), radial-gradient(900px 650px at 75% 65%, oklch(0.65 0.2 290 / 0.16), transparent 60%)",
        }}
      />
      <div style={{ position: "relative", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 160px" }}>
        <div
          style={{
            transform: `scale(${badge})`,
            opacity: badge,
            border: `1px solid ${theme.border}`,
            borderRadius: 999,
            padding: "9px 20px",
            fontSize: 15,
            color: theme.mutedForeground,
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontFamily: body,
          }}
        >
          <span style={{ width: 7, height: 7, borderRadius: 999, background: theme.success, boxShadow: `0 0 10px ${theme.success}` }} />
          Enterprise Infrastructure Operations Platform
        </div>

        <div
          style={{
            marginTop: 34,
            fontFamily: display,
            fontWeight: 600,
            fontSize: 96,
            lineHeight: 1.04,
            letterSpacing: -3,
            textAlign: "center",
            color: theme.foreground,
            opacity: h1,
            transform: `translateY(${h1y}px)`,
          }}
        >
          From the first API call
          <br />
          to the{" "}
          <span style={{ background: theme.gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            last rack unit.
          </span>
        </div>

        <div
          style={{
            marginTop: 28,
            fontFamily: body,
            fontSize: 24,
            color: theme.mutedForeground,
            textAlign: "center",
            maxWidth: 820,
            lineHeight: 1.5,
            opacity: sub,
          }}
        >
          Live health, dependency graphs and incident response for modern infrastructure teams — without switching tabs.
        </div>

        <div style={{ marginTop: 44, display: "flex", gap: 18, opacity: cta }}>
          <div
            style={{
              padding: "16px 34px",
              borderRadius: 12,
              background: theme.gradient,
              color: theme.background,
              fontFamily: display,
              fontWeight: 600,
              fontSize: 20,
              boxShadow: "0 20px 50px oklch(0.78 0.15 200 / 0.3)",
            }}
          >
            Launch console →
          </div>
          <div
            style={{
              padding: "15px 32px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              color: theme.foreground,
              fontFamily: display,
              fontSize: 20,
            }}
          >
            Live demo
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
