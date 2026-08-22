import { interpolate, useCurrentFrame, useVideoConfig } from "remotion";
import { theme } from "../theme";
import { display, mono, body } from "../fonts";
import { AppFrame } from "../components/AppFrame";
import { Badge, GlassPanel, ScoreRing, enter, Cursor } from "../components/ui";

// This is the ACTUAL output of the rule-based fallback engine
// (server/src/services/log-analyzer-engine.service.js) against the built-in
// "Server Logs" example - not placeholder copy.
export const Scene7LogAnalyzer: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const kicker = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
  const reportIn = interpolate(frame, [95, 120], [0, 1], { extrapolateRight: "clamp" });
  const reportY = interpolate(frame, [95, 125], [24, 0], { extrapolateRight: "clamp" });

  const logLines = [
    "12:40:11 INFO  server[web-01] request /api/orders 200 45ms",
    "12:42:03 WARN  server[web-01] slow query 1.2s SELECT * FROM orders",
    "12:44:22 ERROR server[web-01] TimeoutException: db connection timed out",
    "12:46:12 ERROR server[web-01] api response 502 upstream failure",
    "12:49:44 CRITICAL server[web-01] health-check failed 5x consecutive",
    "12:51:00 CRITICAL server[web-01] incident opened INC-4821",
  ];

  return (
    <AppFrame
      active="AI Log Analyzer"
      title="AI Log Analyzer"
      subtitle="Upload logs — AI detects failures, root cause, impact and remediation"
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
        [ 05 ] AI LOG ANALYSIS
      </div>

      {reportIn < 0.5 ? (
        <>
          <GlassPanel style={{ padding: 18 }}>
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: theme.mutedForeground,
                marginBottom: 10,
              }}
            >
              server-logs.log · 6 lines
            </div>
            <div
              style={{
                background: "rgba(0,0,0,0.35)",
                borderRadius: 10,
                padding: 16,
                display: "flex",
                flexDirection: "column",
                gap: 6,
              }}
            >
              {logLines.map((l, i) => {
                const isErr = /ERROR|CRITICAL/.test(l);
                const s = enter(frame, 4 + i * 6, fps, 24, 200);
                return (
                  <div
                    key={i}
                    style={{
                      fontFamily: mono,
                      fontSize: 12,
                      color: isErr ? theme.destructive : theme.mutedForeground,
                      opacity: s,
                    }}
                  >
                    {l}
                  </div>
                );
              })}
            </div>
          </GlassPanel>
          <div
            style={{
              marginTop: 18,
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              padding: "13px 26px",
              borderRadius: 10,
              background: theme.gradient,
              color: theme.background,
              fontFamily: display,
              fontWeight: 600,
              fontSize: 15,
              opacity: interpolate(frame, [45, 60], [0, 1], { extrapolateRight: "clamp" }),
            }}
          >
            ✨ Analyze with AI
          </div>
          <Cursor from={[1000, 500]} to={[195, 425]} delay={55} clickAt={78} />
          {frame > 80 && frame < 95 && (
            <div
              style={{
                marginTop: 20,
                fontFamily: mono,
                fontSize: 13,
                color: theme.mutedForeground,
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: 999,
                  border: `2px solid ${theme.primary}`,
                  borderTopColor: "transparent",
                }}
              />
              Analyzing… detecting errors, finding root cause
            </div>
          )}
        </>
      ) : (
        <div
          style={{
            opacity: reportIn,
            transform: `translateY(${reportY}px)`,
            display: "flex",
            gap: 16,
          }}
        >
          <GlassPanel style={{ padding: 22, flex: 1.6 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <span
                style={{
                  fontFamily: display,
                  fontSize: 15,
                  fontWeight: 600,
                  color: theme.foreground,
                }}
              >
                Executive Summary
              </span>
              <Badge label="Critical" color={theme.destructive} solid />
            </div>
            <div
              style={{
                fontFamily: body,
                fontSize: 13,
                color: theme.foreground,
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              Analyzed 7 log line(s): 5 error(s) (2 critical), 1 warning(s), 1 unique exception
              type(s). Dominant issue category: Database.
            </div>
            <div
              style={{
                marginTop: 14,
                background: "rgba(0,0,0,0.25)",
                borderRadius: 10,
                padding: 14,
              }}
            >
              <div
                style={{
                  fontFamily: mono,
                  fontSize: 10,
                  letterSpacing: 1.5,
                  color: theme.mutedForeground,
                }}
              >
                PROBABLE ROOT CAUSE
              </div>
              <div
                style={{
                  fontFamily: body,
                  fontSize: 13.5,
                  color: theme.foreground,
                  marginTop: 6,
                  fontWeight: 500,
                }}
              >
                Recurring database issues account for the majority of flagged log lines, consistent
                with an active service-impacting incident.
              </div>
            </div>
            <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
              {[
                { l: "Total Errors", v: "5" },
                { l: "Warnings", v: "1" },
                { l: "Critical", v: "2" },
                { l: "Repeated", v: "2" },
              ].map((s) => (
                <div
                  key={s.l}
                  style={{
                    flex: 1,
                    background: "rgba(255,255,255,0.04)",
                    borderRadius: 8,
                    padding: "10px 14px",
                  }}
                >
                  <div style={{ fontFamily: mono, fontSize: 9.5, color: theme.mutedForeground }}>
                    {s.l.toUpperCase()}
                  </div>
                  <div
                    style={{
                      fontFamily: display,
                      fontSize: 22,
                      fontWeight: 600,
                      color: theme.foreground,
                    }}
                  >
                    {s.v}
                  </div>
                </div>
              ))}
            </div>
          </GlassPanel>
          <GlassPanel
            style={{
              padding: 22,
              flex: 1,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
            }}
          >
            <ScoreRing value={65} label="Confidence" delay={100} size={130} color={theme.chart1} />
            <div
              style={{
                fontFamily: mono,
                fontSize: 11,
                color: theme.mutedForeground,
                textAlign: "center",
              }}
            >
              Database 50% · Network 50%
            </div>
          </GlassPanel>
        </div>
      )}
    </AppFrame>
  );
};
