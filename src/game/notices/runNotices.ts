import { useRunToastStore, type RunToastType } from "../../stores/runToastStore";
import { MICRO_CHOICE_META, type MicroChoiceId } from "../tactics/microChoices";

const BASE_NOTICE_MS = 3000;
const MS_PER_CHAR = 35;
const MAX_NOTICE_MS = 6000;

/** Ignore reel-scroll dismiss briefly so tactic notices stay readable. */
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

export function showRunInfoNotice(title: string, body?: string, icon = "info-outline"): void {
  showRunNotice({ type: "info", title, body, icon });
}
