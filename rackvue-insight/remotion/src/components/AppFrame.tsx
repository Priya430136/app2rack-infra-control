import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";

const NAV_GROUPS: { heading: string; items: string[] }[] = [
  {
    heading: "Operations",
    items: [
      "Dashboard",
      "Applications",
      "Servers",
      "Racks",
      "Mapping",
      "Incidents",
      "AI Log Analyzer",
      "AI Optimization Advisor",
      "Data Import",
      "Reports",
      "Audit Logs",
      "Settings",
    ],
  },
];

/** Recreates the real app's sidebar + topbar chrome (see AppSidebar/TopBar
 * components in rackvue-insight/src) so every scene sits inside a
 * screen-accurate shell instead of a generic mockup. */
export const AppFrame: React.FC<{
  active: string;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  enterDelay?: number;
}> = ({ active, title, subtitle, children, enterDelay = 0 }) => {
  const frame = useCurrentFrame();
  const op = interpolate(frame, [enterDelay, enterDelay + 14], [0, 1], {
    extrapolateRight: "clamp",
  });
  const scale = interpolate(frame, [enterDelay, enterDelay + 40], [1.015, 1], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        opacity: op,
        transform: `scale(${scale})`,
        background: theme.background,
        display: "flex",
        flexDirection: "row",
        fontFamily: body,
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          width: 260,
          flexShrink: 0,
          background: "oklch(0.16 0.023 250)",
          borderRight: `1px solid ${theme.border}`,
          padding: "22px 16px",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 6px" }}>
          <div
            style={{
              width: 32,
              height: 32,
              borderRadius: 8,
              background: theme.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 0 24px oklch(0.78 0.15 200 / 0.35)",
            }}
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 24 24"
              fill="none"
              stroke={theme.background}
              strokeWidth={2.5}
            >
              <path d="M3 12h4l3 8 4-16 3 8h4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <div
              style={{
                fontFamily: display,
                fontWeight: 600,
                fontSize: 15,
                color: theme.foreground,
              }}
            >
              App2Rack
            </div>
            <div
              style={{
                fontFamily: mono,
                fontSize: 9,
                letterSpacing: 2,
                color: theme.mutedForeground,
              }}
            >
              INFRA CONTROL
            </div>
          </div>
        </div>

        {NAV_GROUPS.map((g) => (
          <div key={g.heading} style={{ marginTop: 28 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 10,
                letterSpacing: 2,
                color: theme.mutedForeground,
                padding: "0 10px",
                marginBottom: 8,
              }}
            >
              {g.heading.toUpperCase()}
            </div>
            {g.items.map((item) => {
              const isActive = item === active;
              return (
                <div
                  key={item}
                  style={{
                    padding: "9px 10px",
                    borderRadius: 8,
                    fontSize: 13.5,
                    color: isActive ? theme.foreground : theme.mutedForeground,
                    background: isActive ? "oklch(0.78 0.15 200 / 0.14)" : "transparent",
                    fontWeight: isActive ? 600 : 400,
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    marginBottom: 2,
                  }}
                >
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 999,
                      background: isActive ? theme.primary : "transparent",
                      boxShadow: isActive ? `0 0 8px ${theme.primary}` : "none",
                    }}
                  />
                  {item}
                </div>
              );
            })}
          </div>
        ))}

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            alignItems: "center",
            gap: 10,
            padding: "12px 8px",
            borderTop: `1px solid ${theme.border}`,
          }}
        >
          <div
            style={{
              width: 30,
              height: 30,
              borderRadius: 999,
              background: theme.gradient,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: display,
              fontWeight: 700,
              fontSize: 13,
              color: theme.background,
            }}
          >
            P
          </div>
          <div>
            <div style={{ fontSize: 12.5, color: theme.foreground, fontWeight: 500 }}>
              Priya Skand
            </div>
            <div style={{ fontSize: 10.5, color: theme.mutedForeground }}>Infrastructure Lead</div>
          </div>
        </div>
      </div>

      {/* Main column */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {/* Topbar */}
        <div
          style={{
            height: 68,
            flexShrink: 0,
            borderBottom: `1px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "0 32px",
            background: "oklch(0.19 0.026 250 / 0.7)",
          }}
        >
          <div>
            <div
              style={{
                fontFamily: display,
                fontSize: 19,
                fontWeight: 600,
                color: theme.foreground,
              }}
            >
              {title}
            </div>
            {subtitle && (
              <div style={{ fontSize: 12, color: theme.mutedForeground, marginTop: 1 }}>
                {subtitle}
              </div>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                border: `1px solid ${theme.border}`,
                borderRadius: 8,
                padding: "8px 14px",
                width: 260,
                color: theme.mutedForeground,
                fontSize: 13,
              }}
            >
              <svg
                width={13}
                height={13}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <circle cx={11} cy={11} r={7} />
                <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
              </svg>
              Search apps, servers, racks…
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: mono,
                  fontSize: 10,
                  border: `1px solid ${theme.border}`,
                  borderRadius: 4,
                  padding: "1px 5px",
                }}
              >
                Ctrl K
              </span>
            </div>
            <div
              style={{
                position: "relative",
                width: 32,
                height: 32,
                borderRadius: 999,
                border: `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <svg
                width={15}
                height={15}
                viewBox="0 0 24 24"
                fill="none"
                stroke={theme.mutedForeground}
                strokeWidth={2}
              >
                <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 01-3.46 0" />
              </svg>
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: theme.destructive,
                }}
              />
            </div>
          </div>
        </div>

        {/* Content */}
        <div style={{ flex: 1, padding: "28px 32px", overflow: "hidden" }}>{children}</div>
      </div>
    </AbsoluteFill>
  );
};
