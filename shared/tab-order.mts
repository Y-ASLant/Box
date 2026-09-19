import type { TabDropPosition } from './types.mts';

export function reorderIds(
  ids: readonly string[],
  movingId: string,
  targetId: string,
  position: TabDropPosition
): string[] | null {
  if (movingId === targetId || !ids.includes(movingId) || !ids.includes(targetId)) return null;

  const nextIds = ids.filter(id => id !== movingId);
  const targetIndex = nextIds.indexOf(targetId);
  nextIds.splice(position === 'after' ? targetIndex + 1 : targetIndex, 0, movingId);
  return nextIds;
}
