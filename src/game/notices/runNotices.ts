import { DEBUFF_CATALOG } from "../../data/debuffs";
import { PERK_CATALOG } from "../../data/perks";
import { RELIC_CATALOG } from "../../data/relics";
import { resolveEntityIcon } from "../content/resolveIcon";
import { useRunToastStore, type RunToastType } from "../../stores/runToastStore";
import type { CycleRewardPackage } from "../cycle/cycleProgression";
import { MICRO_CHOICE_META, type MicroChoiceId } from "../tactics/microChoices";

const BASE_NOTICE_MS = 3000;
const MS_PER_CHAR = 35;
const MAX_NOTICE_MS = 6000;

/** Ignore reel-scroll dismiss briefly so notices stay readable. */
export const NOTICE_SCROLL_GRACE_MS = 700;

/** How long a notice stays visible — scales with copy length. */
export function noticeDurationMs(title: string, body?: string): number {
  const chars = title.length + (body?.length ?? 0);
  return Math.min(MAX_NOTICE_MS, BASE_NOTICE_MS + Math.max(0, chars - 36) * MS_PER_CHAR);
}

export function shouldDismissNoticeOnScroll(): boolean {
  const toast = useRunToastStore.getState().toast;
  if (toast == null) return false;
  return Date.now() - toast.createdAt >= NOTICE_SCROLL_GRACE_MS;
}

export function showRunNotice(input: {
  type: RunToastType;
  title: string;
  body?: string;
  icon?: string;
  durationMs?: number;
}): void {
  const durationMs = input.durationMs ?? noticeDurationMs(input.title, input.body);
  useRunToastStore.getState().show({
    type: input.type,
    title: input.title,
    body: input.body,
    icon: input.icon,
    durationMs,
  });
}

export function showTacticChosenNotice(id: MicroChoiceId): void {
  const meta = MICRO_CHOICE_META[id];
  showRunNotice({
    type: "success",
    title: meta.label,
    body: meta.chosen,
    icon: meta.icon,
  });
}

export function showPerkWonNotice(perkId: string): void {
  const perk = PERK_CATALOG[perkId];
  if (perk == null) return;
  showRunNotice({
    type: "success",
    title: "Perk won",
    body: perk.name,
    icon: perk.icon,
    durationMs: noticeDurationMs("Perk won", perk.name),
  });
}

export function showShieldPerkNotice(perkId: string): void {
  const perk = PERK_CATALOG[perkId];
  if (perk == null) return;
  showRunNotice({
    type: "success",
    title: "Shield perk",
    body: perk.name,
    icon: perk.icon,
    durationMs: noticeDurationMs("Shield perk", perk.name),
  });
}

export function showRelicWonNotice(relicId: string): void {
  const relic = RELIC_CATALOG[relicId];
  const resolved = resolveEntityIcon("relic", relicId);
  if (relic == null) return;
  showRunNotice({
    type: "success",
    title: "Relic won",
    body: `${relic.name} — ${relic.description}`,
    icon: resolved.icon,
    durationMs: noticeDurationMs("Relic won", relic.description),
  });
}

export function showDebuffWonNotice(debuffId: string): void {
  const debuff = DEBUFF_CATALOG[debuffId];
  if (debuff == null) return;
  showRunNotice({
    type: "error",
    title: "Curse gained",
    body: debuff.name,
    icon: debuff.icon,
    durationMs: noticeDurationMs("Curse gained", debuff.name),
  });
}

export function showRunInfoNotice(title: string, body?: string, icon = "info-outline"): void {
  showRunNotice({ type: "info", title, body, icon });
}

export function showCycleClearedNotice(reward: CycleRewardPackage): void {
  showRunNotice({
    type: "success",
    title: reward.headline,
    body: reward.detail,
    icon: "emoji-events",
    durationMs: noticeDurationMs(reward.headline, reward.detail),
  });
}
