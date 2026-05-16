import { useId, useMemo } from "react";
import Svg, { Circle, Defs, G, Mask } from "react-native-svg";
import { REEL_STRIP } from "../reelStripConstants";

function halton(index: number, base: number): number {
  let f = 1;
  let r = 0;
  let i = index;
  while (i > 0) {
    f /= base;
    r += f * (i % base);
    i = Math.floor(i / base);
  }
  return r;
}

type WheelScrollFilmGrainProps = {
  discSize: number;
};

/**
 * Circular film grain over the prize disc — masked dots only (no blur on wheel geometry).
 */
export function WheelScrollFilmGrain({ discSize }: WheelScrollFilmGrainProps) {
  const uid = useId().replace(/:/g, "");
  const maskId = `wsgm-${uid}`;

  const s = Math.max(48, Math.round(discSize));
  const cx = s / 2;
  const cy = s / 2;
  const rMask = s / 2 - 0.5;

  const dots = useMemo(() => {
    const { dotCount } = REEL_STRIP.visuals.wheelScrollGrain;
    const out: { x: number; y: number; radius: number; fill: string }[] = [];
    const R = rMask - 1;
    for (let i = 1; i <= dotCount; i++) {
      const u = halton(i, 2);
      const v = halton(i, 3);
      const rad = R * Math.sqrt(u);
      const th = v * Math.PI * 2;
      const x = cx + rad * Math.cos(th);
      const y = cy + rad * Math.sin(th);
      const phase = i % 5;
      const radius = 0.35 + (phase % 3) * 0.28;
      const light = i % 2 === 0;
      const fill = light ? "rgba(255,255,255,0.28)" : "rgba(15, 23, 42, 0.10)";
      out.push({ x, y, radius, fill });
    }
    return out;
  }, [cx, cy, discSize, rMask]);

  return (
    <Svg width={s} height={s} viewBox={`0 0 ${s} ${s}`}>
      <Defs>
        <Mask id={maskId}>
          <Circle cx={cx} cy={cy} r={rMask} fill="white" />
        </Mask>
      </Defs>
      <G mask={`url(#${maskId})`}>
        {dots.map((d, i) => (
          <Circle key={i} cx={d.x} cy={d.y} r={d.radius} fill={d.fill} />
        ))}
      </G>
    </Svg>
  );
}
