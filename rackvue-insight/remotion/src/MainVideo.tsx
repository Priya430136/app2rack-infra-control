import { AbsoluteFill } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { BgGradient, Grid } from "./components/Grid";
import { Scene1Boot } from "./scenes/Scene1Boot";
import { Scene2Landing } from "./scenes/Scene2Landing";
import { Scene3Dashboard } from "./scenes/Scene3Dashboard";
import { Scene4Applications } from "./scenes/Scene4Applications";
import { Scene5Servers } from "./scenes/Scene5Servers";
import { Scene6Racks } from "./scenes/Scene6Racks";
import { Scene7LogAnalyzer } from "./scenes/Scene7LogAnalyzer";
import { Scene8Optimization } from "./scenes/Scene8Optimization";
import { Scene9Search } from "./scenes/Scene9Search";
import { Scene10Incidents } from "./scenes/Scene10Incidents";
import { Scene11Settings } from "./scenes/Scene11Settings";
import { Scene12CTA } from "./scenes/Scene12CTA";

const T = { durationInFrames: 20 };

export const MainVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <BgGradient />
      <Grid opacity={0.12} />

      <TransitionSeries>
        <TransitionSeries.Sequence durationInFrames={60}>
          <Scene1Boot />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={160}>
          <Scene2Landing />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={260}>
          <Scene3Dashboard />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, ...T })}
        />

        <TransitionSeries.Sequence durationInFrames={220}>
          <Scene4Applications />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, ...T })}
        />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene5Servers />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, ...T })}
        />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene6Racks />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={260}>
          <Scene7LogAnalyzer />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, ...T })}
        />

        <TransitionSeries.Sequence durationInFrames={240}>
          <Scene8Optimization />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={120}>
          <Scene9Search />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={210}>
          <Scene10Incidents />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, ...T })}
        />

        <TransitionSeries.Sequence durationInFrames={150}>
          <Scene11Settings />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition presentation={fade()} timing={linearTiming(T)} />

        <TransitionSeries.Sequence durationInFrames={180}>
          <Scene12CTA />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
