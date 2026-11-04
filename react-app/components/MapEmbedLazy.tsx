"use client";

import { useEffect } from "react";

// Replaces the .lp-mapb click-to-load map-embed handler: on click, swaps a placeholder button
// for a real lazy-loaded <iframe> (its src comes from data-src on the placeholder's wrapper),
// same as the legacy bundle. Not to be confused with the (still-legacy, sub-expr #12) Google
// Maps JS-API dark-theme styling array used elsewhere.
export default function MapEmbedLazy() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const m = (e.target as HTMLElement | null)?.closest<HTMLElement>(".lp-mapb");
      if (!m) return;
      const wrap = m.parentNode as HTMLElement | null;
      if (!wrap) return;
      const f = document.createElement("iframe");
      f.title = wrap.querySelector("p")?.textContent || "";
      f.src = wrap.getAttribute("data-src") || "";
      f.loading = "lazy";
      f.referrerPolicy = "no-referrer-when-downgrade";
      wrap.innerHTML = "";
      wrap.classList.add("on");
      wrap.appendChild(f);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
