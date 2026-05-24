import { buildFloatingDollars, type DollarParticleSpec } from "./homeFloatingDollars";
import { buildHeroWheelCluster, type HeroWheelSpec } from "./homeHeroWheels";

export type HomeStageLayout = {
  width: number;
  height: number;
  wheels: HeroWheelSpec[];
  dollars: DollarParticleSpec[];
};

/** Use rounded screen size so positions match the stage (avoids coin/wheel jump). */
export function buildHomeStageLayout(width: number, height: number): HomeStageLayout {
  const w = Math.round(width);
  const h = Math.round(height);
  return {
    width: w,
    height: h,
    wheels: buildHeroWheelCluster(w, h),
    dollars: buildFloatingDollars(w, h),
  };
}
