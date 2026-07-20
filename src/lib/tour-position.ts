// Shared tooltip positioning for the walkthrough tours. Keeps the WHOLE tooltip
// (including its Next/Finish footer) inside the viewport by clamping both axes
// against the measured tooltip size — so the buttons are never pushed off-screen
// and unclickable.

export type TourPlacement = "auto" | "top" | "bottom" | "left" | "right" | "side" | undefined;

export function computeTooltipPosition(
  t: DOMRect,
  placement: TourPlacement,
  w: number,
  h: number,
): { left: number; top: number } {
  const gap = 18;
  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  let left: number;
  let top: number;

  if (placement === "top") {
    left = t.left + t.width / 2 - w / 2;
    top = t.top - gap - h;
  } else if (placement === "bottom") {
    left = t.left + t.width / 2 - w / 2;
    top = t.bottom + gap;
  } else if (placement === "left" || placement === "right" || placement === "side") {
    const centerX = t.left + t.width / 2;
    const preferRight = placement === "right" || (placement === "side" && centerX < vw / 2);
    top = t.top + t.height / 2 - h / 2;
    if (preferRight) {
      left = t.right + gap;
      if (left + w + margin > vw) left = t.left - gap - w;
    } else {
      left = t.left - gap - w;
      if (left < margin) left = Math.min(t.right + gap, vw - w - margin);
    }
  } else {
    // auto: prefer right of the target, fall back to left, then below it.
    left = t.right + gap;
    top = t.top + t.height / 2 - h / 2;
    if (left + w + margin > vw) {
      const leftSide = t.left - gap - w;
      if (leftSide >= margin) {
        left = leftSide;
      } else {
        left = t.left + t.width / 2 - w / 2;
        top = t.bottom + gap;
      }
    }
  }

  // Hard clamp both axes so the tooltip (and its buttons) always stay on-screen.
  left = Math.max(margin, Math.min(left, vw - w - margin));
  top = Math.max(margin, Math.min(top, vh - h - margin));
  return { left, top };
}
