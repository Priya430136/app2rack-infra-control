import { AbsoluteFill, useCurrentFrame } from "remotion";
import { theme } from "../theme";

export const Grid: React.FC<{ opacity?: number }> = ({ opacity = 0.35 }) => {
  const frame = useCurrentFrame();
  const shift = (frame * 0.4) % 80;
  return (
    <AbsoluteFill
      style={{
        opacity,
        backgroundImage: `linear-gradient(${theme.border} 1px, transparent 1px), linear-gradient(90deg, ${theme.border} 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
        backgroundPosition: `${shift}px ${shift}px`,
        maskImage: "radial-gradient(ellipse at center, rgba(0,0,0,0.9) 30%, rgba(0,0,0,0) 75%)",
      }}
    />
  );
};

export const BgGradient: React.FC = () => {
  const frame = useCurrentFrame();
  const t = (Math.sin(frame / 90) + 1) / 2;
  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at ${20 + t * 15}% ${30 + t * 10}%, rgba(34,211,238,0.18), transparent 60%), radial-gradient(1000px 700px at ${80 - t * 15}% ${70 - t * 10}%, rgba(168,85,247,0.20), transparent 60%), ${theme.bg}`,
      }}
    />
  );
};
