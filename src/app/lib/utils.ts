import { generateKeyBetween } from "fractional-indexing";

export function calculateNewOrder<T extends { order: string }>(
  items: T[],
  targetIndex: number,
): string {
  if (items.length === 0) {
    return generateKeyBetween(null, null);
  }

  if (targetIndex === 0) {
    return generateKeyBetween(null, items[0].order);
  }

  if (targetIndex >= items.length) {
    return generateKeyBetween(items[items.length - 1].order, null);
  }

  const prevItem = items[targetIndex - 1];
  const nextItem = items[targetIndex];
  return generateKeyBetween(prevItem.order, nextItem.order);
}
