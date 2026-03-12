import gsap from 'gsap';

/** Stagger-reveal a list of elements from below */
export function staggerReveal(
  targets: string | Element | Element[],
  delay = 0
): gsap.core.Tween {
  return gsap.fromTo(
    targets,
    { opacity: 0, y: 32, scale: 0.96 },
    {
      opacity: 1,
      y: 0,
      scale: 1,
      duration: 0.45,
      ease: 'power3.out',
      stagger: 0.07,
      delay,
    }
  );
}

/** Animate a drop zone "shrink to top" */
export function shrinkDropzone(el: Element): gsap.core.Tween {
  return gsap.to(el, {
    height: 80,
    duration: 0.5,
    ease: 'power4.inOut',
  });
}

/** Expand drop zone back to full */
export function expandDropzone(el: Element): gsap.core.Tween {
  return gsap.to(el, {
    height: 320,
    duration: 0.5,
    ease: 'power4.inOut',
  });
}

/** Animate SVG stroke (progress circle) */
export function animateProgress(
  circle: SVGCircleElement,
  pct: number,
  circumference: number
): gsap.core.Tween {
  const offset = circumference - (pct / 100) * circumference;
  return gsap.to(circle, {
    strokeDashoffset: offset,
    duration: 1.2,
    ease: 'elastic.out(1, 0.5)',
  });
}

/** Fade-in a single element */
export function fadeIn(el: Element, delay = 0): gsap.core.Tween {
  return gsap.fromTo(
    el,
    { opacity: 0 },
    { opacity: 1, duration: 0.3, ease: 'power2.out', delay }
  );
}

/** Morph between two views */
export function morphView(
  outEl: Element,
  inEl: Element,
  onComplete?: () => void
): void {
  gsap
    .timeline({ onComplete })
    .to(outEl, { opacity: 0, y: -20, duration: 0.3, ease: 'power2.in' })
    .fromTo(
      inEl,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
      '-=0.1'
    );
}

/** Bounce success indicator */
export function bounceSuccess(el: Element): gsap.core.Tween {
  return gsap.fromTo(
    el,
    { scale: 0.5, opacity: 0 },
    { scale: 1, opacity: 1, duration: 0.6, ease: 'elastic.out(1, 0.4)' }
  );
}
