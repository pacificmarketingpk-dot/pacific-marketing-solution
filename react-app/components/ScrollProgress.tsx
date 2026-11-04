"use client";

import { useEffect } from "react";

// Replaces app.js sub-expr #2: scroll progress bar in the header, driven by a scaleX transform.
export default function ScrollProgress() {
  useEffect(() => {
    const bar = document.getElementById("sp");
    if (!bar) return;

    let ticking = false;

    function update() {
      ticking = false;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - doc.clientHeight;
      const pct = scrollable > 0 ? Math.min(1, Math.max(0, doc.scrollTop / scrollable)) : 0;
      bar!.style.transform = `scaleX(${pct})`;
    }

    function onScroll() {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return null;
}
