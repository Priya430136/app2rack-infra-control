import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";

export const Scene12CTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const wordmark = spring({ frame, fps, config: { damping: 20, stiffness: 140 } });
  const y = interpolate(wordmark, [0, 1], [30, 0]);
  const subOp = interpolate(frame, [18, 38], [0, 1], { extrapolateRight: "clamp" });
  const chipOp = spring({ frame: frame - 38, fps, config: { damping: 16 } });

  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        background: theme.background,
      }}
    >
      <AbsoluteFill
        style={{
          background:
            "radial-gradient(1000px 700px at 50% 40%, oklch(0.78 0.15 200 / 0.14), transparent 60%), radial-gradient(800px 600px at 70% 70%, oklch(0.65 0.2 290 / 0.14), transparent 60%)",
        }}
      />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 18,
          transform: `translateY(${y}px)`,
          opacity: wordmark,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: 18,
            background: theme.gradient,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 70px oklch(0.78 0.15 200 / 0.4)",
          }}
        >
          <svg
            width={36}
            height={36}
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
            fontSize: 84,
            letterSpacing: -3,
            color: theme.foreground,
          }}
        >
          App2Rack
        </div>
      </div>

      <div
        style={{
          marginTop: 26,
          fontFamily: body,
          fontSize: 26,
          color: theme.mutedForeground,
          opacity: subOp,
          textAlign: "center",
          maxWidth: 900,
          lineHeight: 1.5,
        }}
      >
        The operations console for modern infrastructure teams.
        <br />
        From code to rack, end-to-end.
      </div>

      <div
        style={{
          marginTop: 46,
          display: "flex",
          alignItems: "center",
          gap: 18,
          transform: `scale(${chipOp})`,
          opacity: chipOp,
        }}
      >
        <div
          style={{
            padding: "18px 40px",
            borderRadius: 12,
            background: theme.gradient,
            color: theme.background,
            fontFamily: display,
            fontWeight: 600,
            fontSize: 22,
            boxShadow: "0 20px 60px oklch(0.78 0.15 200 / 0.35)",
          }}
        >
          Get started free →
        </div>
        <div
          style={{
            padding: "16px 36px",
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            color: theme.foreground,
            fontFamily: mono,
            fontSize: 17,
            letterSpacing: 1,
          }}
        >
          No credit card · Deploys in 4 minutes
        </div>
      </div>
    </AbsoluteFill>
  );
};
