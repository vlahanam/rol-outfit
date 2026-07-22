import { useCallback } from "react";

const FLY_DURATION = 650;
const BOUNCE_DELAY = 580;

export function useFlyToCart() {
  const trigger = useCallback((imgSrc: string) => {
    if (typeof window === "undefined") return;

    const srcEl = document.getElementById("product-main-img");
    const cartEl = document.getElementById("cart-icon");
    if (!srcEl || !cartEl) return;

    const srcRect = srcEl.getBoundingClientRect();
    const cartRect = cartEl.getBoundingClientRect();

    if (srcRect.width === 0 || cartRect.width === 0) return;

    // Start at center of the product image
    const startX = srcRect.left + srcRect.width / 2 - 30;
    const startY = srcRect.top + srcRect.height / 2 - 30;

    // End at center of cart icon
    const endX = cartRect.left + cartRect.width / 2 - 10;
    const endY = cartRect.top + cartRect.height / 2 - 10;

    const dx = endX - startX;
    const dy = endY - startY;

    // Use a div with background-image — more reliable than <img> for animations
    const el = document.createElement("div");
    el.style.cssText = `
      position: fixed;
      left: ${startX}px;
      top: ${startY}px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      background-color: #e5e7eb;
      ${imgSrc ? `background-image: url('${CSS.escape?.(imgSrc) ?? imgSrc}');` : ""}
      background-size: cover;
      background-position: center;
      z-index: 2147483647;
      pointer-events: none;
      box-shadow: 0 4px 16px rgba(0,0,0,0.35);
      will-change: transform, opacity;
    `;
    document.documentElement.appendChild(el);

    // wait one frame so the browser has laid out the element before animating
    const arcLift = Math.min(140, Math.abs(dy) * 0.5 + 40);
    requestAnimationFrame(() => {
      const anim = el.animate(
        [
          { transform: "translate(0, 0) scale(1)", opacity: "1" },
          {
            transform: `translate(${dx * 0.45}px, ${dy * 0.5 - arcLift}px) scale(0.65)`,
            opacity: "0.85",
            offset: 0.45,
          },
          {
            transform: `translate(${dx}px, ${dy}px) scale(0.22)`,
            opacity: "0",
          },
        ],
        {
          duration: FLY_DURATION,
          easing: "cubic-bezier(0.2, 0, 0.8, 1)",
          fill: "forwards",
        },
      );

      anim.onfinish = () => el.remove();
    });

    // Bounce cart icon when thumbnail arrives
    setTimeout(() => {
      cartEl.classList.add("cart-bounce");
      setTimeout(() => cartEl.classList.remove("cart-bounce"), 450);
    }, BOUNCE_DELAY);

    // Safety cleanup in case onfinish doesn't fire
    setTimeout(() => el.remove(), FLY_DURATION + 200);
  }, []);

  return { trigger };
}
