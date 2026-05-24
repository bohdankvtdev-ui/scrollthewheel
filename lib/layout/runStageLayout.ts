import type { RunChromeMetrics } from "./runChrome";
import { shouldUseLargeRunUi } from "./largeRunUi";

import {

  computeBulbRingLayout,

  computeSpinWheelTextSize,

  computeStageMinWidth,

  normalizeWheelInnerSize,

  WHEEL_INNER_MAX_LARGE,

  WHEEL_INNER_MAX_PHONE,

} from "./wheelFrame";



const BULB_COUNT = 20;

/** Keep in sync with `NeoBulbRingLayoutChrome` in `theme/neoBrutal.ts`. */

const BULB_RING_CHROME = {

  ringBorderOuterPx: 2,

  ringInnerStrokeMaxPx: 6,

  bulbToStrokeGapPx: 1,

} as const;

const MIN_WHEEL = 200;



/** Predict wheel feed height before `onLayout` — avoids wheel size jumping on first paint. */

export function estimateRunWheelFeedHeight(chrome: RunChromeMetrics): number {
  const reserved =
    chrome.bar.minHeight +
    chrome.stage.height +
    chrome.layout.loadout +
    chrome.wheelHud.minHeight +
    chrome.layout.prizeFlash +
    8;

  return Math.max(280, Math.floor(chrome.height - reserved));

}



export type RunWheelStageDimensions = {

  wheelInnerSize: number;

  wheelInnerMax: number;

  stageWidth: number;

  stageHeight: number;

  textSize: number;

};



/**

 * Fit wheel + bulb ring inside the reel slot (width × height) without clipping or

 * shrinking via flex — stable across iPhone / iPad / web.

 */

export function computeRunWheelStageDimensions(

  slotWidth: number,

  slotHeight: number,

  largeStage = false

): RunWheelStageDimensions {

  const padH = largeStage ? 2 : 8;

  const padV = largeStage ? 2 : 8;

  const innerW = Math.max(160, slotWidth - padH * 2);

  const innerH = Math.max(160, slotHeight - padV * 2);

  const wheelInnerMax = largeStage ? WHEEL_INNER_MAX_LARGE : WHEEL_INNER_MAX_PHONE;

  const maxWheel = largeStage

    ? Math.min(wheelInnerMax, Math.floor(Math.min(innerW, innerH) * 0.97))

    : WHEEL_INNER_MAX_PHONE;



  let wheelInnerSize = MIN_WHEEL;

  for (let candidate = maxWheel; candidate >= MIN_WHEEL; candidate -= 2) {

    const wheel = normalizeWheelInnerSize(candidate, wheelInnerMax);

    const layout = computeBulbRingLayout({

      wheelInnerSize: wheel,

      bulbCount: BULB_COUNT,

      maxWheelInnerSize: wheelInnerMax,

      ...BULB_RING_CHROME,

    });

    const stageW = computeStageMinWidth(wheel, layout.outerDiameter, wheelInnerMax);

    const stageH = layout.outerDiameter;

    if (stageW <= innerW && stageH <= innerH) {

      wheelInnerSize = wheel;

      break;

    }

  }



  const layout = computeBulbRingLayout({

    wheelInnerSize,

    bulbCount: BULB_COUNT,

    maxWheelInnerSize: wheelInnerMax,

    ...BULB_RING_CHROME,

  });



  return {

    wheelInnerSize: normalizeWheelInnerSize(wheelInnerSize, wheelInnerMax),

    wheelInnerMax,

    stageWidth: computeStageMinWidth(wheelInnerSize, layout.outerDiameter, wheelInnerMax),

    stageHeight: layout.outerDiameter,

    textSize: computeSpinWheelTextSize(wheelInnerSize),

  };

}



/** Tablet, iPad, or wide web/desktop viewports use the large run wheel layout. */

export function shouldUseLargeRunWheel(input: {
  tablet?: boolean;
  isPad?: boolean;
  platformOs: string;
  width: number;
  height: number;
}): boolean {
  return shouldUseLargeRunUi({
    width: input.width,
    height: input.height,
    tablet: input.tablet,
    isPad: input.isPad,
    platformOs: input.platformOs,
  });
}

