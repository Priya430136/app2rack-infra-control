import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";

export const enter = (frame: number, delay: number, fps: number, damping = 18, stiffness = 160) =>
  spring({ frame: frame - delay, fps, config: { damping, stiffness } });

export const Badge: React.FC<{ label: string; color: string; solid?: boolean }> = ({
  label,
  color,
  solid,
}) => (
  <span
    style={{
      fontFamily: mono,
      fontSize: 13,
      letterSpacing: 0.5,
      padding: "3px 10px",
      borderRadius: 999,
      color: solid ? theme.background : color,
      background: solid ? color : `color-mix(in oklab, ${color} 16%, transparent)`,
      border: solid ? "none" : `1px solid color-mix(in oklab, ${color} 45%, transparent)`,
      fontWeight: 600,
      display: "inline-block",
    }}
  >
    {label}
  </span>
);

export const ProgressBar: React.FC<{
  value: number;
  color: string;
  delay: number;
  width?: number;
}> = ({ value, color, delay, width = 100 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps, 22, 140);
  return (
    <div
      style={{
        height: 6,
        width,
        borderRadius: 999,
        background: "rgba(255,255,255,0.08)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${value * s}%`,
          borderRadius: 999,
          background: color,
        }}
      />
    </div>
  );
};

export const ScoreRing: React.FC<{
  value: number;
  label: string;
  delay: number;
  size?: number;
  color?: string;
}> = ({ value, label, delay, size = 100, color = theme.chart4 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps, 20, 120);
  const r = (size - 10) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div
      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: s }}
    >
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke="rgba(255,255,255,0.08)"
            strokeWidth={7}
            fill="none"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            stroke={color}
            strokeWidth={7}
            fill="none"
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c - (c * value * s) / 100}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: display,
            fontWeight: 600,
            fontSize: size * 0.24,
            color: theme.foreground,
          }}
        >
          {Math.round(value * s)}
        </div>
      </div>
      <div
        style={{
          fontFamily: mono,
          fontSize: 12,
          color: theme.mutedForeground,
          letterSpacing: 0.5,
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>
    </div>
  );
};

export const KpiCard: React.FC<{
  label: string;
  value: string;
  sub: string;
  icon?: string;
  accent: string;
  delay: number;
}> = ({ label, value, sub, accent, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = enter(frame, delay, fps);
  const y = interpolate(s, [0, 1], [24, 0]);
  return (
    <div
      style={{
        opacity: s,
        transform: `translateY(${y}px)`,
        background: theme.cardAlt,
        border: `1px solid ${theme.border}`,
        borderRadius: 16,
        padding: "20px 24px",
        flex: 1,
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        style={{ fontFamily: body, fontSize: 13, color: theme.mutedForeground, letterSpacing: 0.3 }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: display,
          fontSize: 40,
          fontWeight: 600,
          color: theme.foreground,
          marginTop: 6,
        }}
      >
        {value}
      </div>
      <div style={{ fontFamily: body, fontSize: 13, color: accent, marginTop: 4 }}>{sub}</div>
    </div>
  );
};

export const GlassPanel: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children,
  style,
}) => (
  <div
    style={{
      background: theme.cardAlt,
      border: `1px solid ${theme.border}`,
      borderRadius: 18,
      backdropFilter: "blur(14px)",
      ...style,
    }}
  >
    {children}
  </div>
);

export const SectionKicker: React.FC<{ index: string; label: string; delay: number }> = ({
  index,
  label,
  delay,
}) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [delay, delay + 15], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        fontFamily: mono,
        color: theme.primary,
        letterSpacing: 6,
        fontSize: 16,
        opacity: op,
        display: "flex",
        alignItems: "center",
        gap: 10,
      }}
    >
      <span style={{ opacity: 0.6 }}>[{index}]</span> {label}
    </div>
  );
};

/** A simulated mouse pointer that animates from one point to another, for a "click" beat. */
export const Cursor: React.FC<{
  from: [number, number];
  to: [number, number];
  delay: number;
  clickAt?: number;
}> = ({ from, to, delay, clickAt }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 26, stiffness: 90 } });
  const x = interpolate(s, [0, 1], [from[0], to[0]]);
  const y = interpolate(s, [0, 1], [from[1], to[1]]);
  const clickFrame = clickAt ?? delay + 24;
  const clicked = frame >= clickFrame;
  const clickT = interpolate(frame, [clickFrame, clickFrame + 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const op = interpolate(frame, [delay - 6, delay + 2], [0, 1], { extrapolateRight: "clamp" });
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        zIndex: 50,
        opacity: op,
        pointerEvents: "none",
      }}
    >
      {clicked && (
        <div
          style={{
            position: "absolute",
            left: -18 - clickT * 10,
            top: -18 - clickT * 10,
            width: 36 + clickT * 20,
            height: 36 + clickT * 20,
            borderRadius: 999,
            border: `2px solid ${theme.primary}`,
            opacity: 1 - clickT,
          }}
        />
      )}
      <svg
        width={26}
        height={26}
        viewBox="0 0 26 26"
        style={{ filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.5))" }}
      >
        <path
          d="M2 2 L2 20 L7.5 15.5 L11 23 L14.5 21.5 L11 14 L18 14 Z"
          fill="white"
          stroke="#0006"
          strokeWidth={1}
        />
      </svg>
    </div>
  );
};
