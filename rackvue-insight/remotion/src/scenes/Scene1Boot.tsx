import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono } from "../fonts";

export const Scene1Boot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const logo = spring({ frame, fps, config: { damping: 14, stiffness: 170 } });
  const label = interpolate(frame, [12, 30], [0, 1], { extrapolateRight: "clamp" });
  const pulse = 0.6 + 0.4 * Math.sin(frame / 4);

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: theme.background,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 16, transform: `scale(${logo})` }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: 16,
            background: theme.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: `0 0 60px oklch(0.78 0.15 200 / 0.4)`,
          }}
        >
          <svg
            width={32}
            height={32}
            viewBox="0 0 24 24"
            fill="none"
            stroke={theme.background}
            strokeWidth={2.5}
          >
            <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div
          style={{
            fontFamily: display,
            fontWeight: 700,
            fontSize: 56,
            color: theme.foreground,
            letterSpacing: -1,
          }}
        >
          App2Rack
        </div>
      </div>

      <div
        style={{ marginTop: 30, display: "flex", alignItems: "center", gap: 12, opacity: label }}
      >
        <div style={{ position: "relative", width: 10, height: 10 }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 999,
              background: theme.success,
              opacity: pulse,
              boxShadow: `0 0 20px ${theme.success}`,
            }}
          />
        </div>
        <span
          style={{ fontFamily: mono, fontSize: 16, letterSpacing: 4, color: theme.mutedForeground }}
        >
          INFRASTRUCTURE CONTROL · INITIALIZING
        </span>
      </div>
    </AbsoluteFill>
  );
};
