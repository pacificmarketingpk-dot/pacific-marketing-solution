"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function ev(name: string, params?: Record<string, unknown>) {
  try {
    window.gtag?.("event", name, params || {});
  } catch {
    // ignore
  }
  try {
    (window.dataLayer = window.dataLayer || []).push({ event: name, ...(params || {}) });
  } catch {
    // ignore
  }
}

// Replaces the .lp-vb click-to-play-video-testimonial handler: swaps the poster-image button
// for a real <video> element and starts playback, same as the legacy bundle.
export default function VideoTestimonialPlay() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const b = (e.target as HTMLElement | null)?.closest<HTMLElement>(".lp-vb");
      if (!b) return;
      const v = document.createElement("video");
      v.controls = true;
      v.playsInline = true;
      v.setAttribute("playsinline", "");
      v.poster = b.getAttribute("data-poster") || "";
      v.src = b.getAttribute("data-src") || "";
      const label = b.getAttribute("aria-label");
      if (label) v.setAttribute("aria-label", label);
      b.replaceWith(v);
      const p = v.play();
      p?.catch?.(() => {});
      ev("video_play", { video_url: v.src });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
