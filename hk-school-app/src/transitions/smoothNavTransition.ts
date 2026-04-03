import { Animation, createAnimation, getIonPageElement } from "@ionic/react";

/**
 * Ionic router outlet transition: forward = scale-up enter + subtle zoom-out leave;
 * back = slide/scale reverse. Works for web + Capacitor.
 */
export const smoothNavTransition = (
  _baseEl: Element,
  opts: {
    direction?: string;
    enteringEl: HTMLElement;
    leavingEl?: HTMLElement;
    duration?: number;
  }
): Animation => {
  const backDirection = opts.direction === "back";
  const enteringEl = opts.enteringEl;
  const leavingEl = opts.leavingEl;
  const enteringPage = getIonPageElement(enteringEl);

  const root = createAnimation()
    .addElement(enteringPage)
    .fill("both")
    .beforeRemoveClass("ion-page-invisible");

  if (backDirection) {
    root
      .duration(opts.duration ?? 260)
      .easing("cubic-bezier(0.33, 1, 0.68, 1)")
      .fromTo("transform", "translateX(-10%) scale(0.97)", "translateX(0) scale(1)")
      .fromTo("opacity", 0.88, 1);

    if (leavingEl) {
      const leavingPage = createAnimation()
        .addElement(getIonPageElement(leavingEl))
        .duration(opts.duration ?? 260)
        .easing("cubic-bezier(0.33, 1, 0.68, 1)")
        .fromTo("transform", "translateX(0) scale(1)", "translateX(18%) scale(0.96)")
        .fromTo("opacity", 1, 0.65);
      root.addAnimation(leavingPage);
    }
  } else {
    root
      .duration(opts.duration ?? 340)
      .easing("cubic-bezier(0.22, 1, 0.36, 1)")
      .fromTo("transform", "translateY(14px) scale(0.94)", "translateY(0) scale(1)")
      .fromTo("opacity", 0.02, 1);

    if (leavingEl) {
      const leavingPage = createAnimation()
        .addElement(getIonPageElement(leavingEl))
        .duration(opts.duration ?? 340)
        .easing("cubic-bezier(0.22, 1, 0.36, 1)")
        .fromTo("transform", "translateY(0) scale(1)", "translateY(-10px) scale(0.96)")
        .fromTo("opacity", 1, 0.72);
      root.addAnimation(leavingPage);
    }
  }

  return root;
};
