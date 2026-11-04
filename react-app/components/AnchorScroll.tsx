"use client";

import { useEffect } from "react";

// Replaces app.js sub-expr #6: smooth-scroll for [data-anchor] links (e.g. "Get Free Growth
// Plan" -> #get-plan), delegated at the document level so it works on content injected via
// dangerouslySetInnerHTML as well as the Header/Footer.
export default function AnchorScroll() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const a = target?.closest<HTMLElement>("[data-anchor]");
      if (!a) return;

      const raw = a.getAttribute("data-anchor") || a.getAttribute("href") || "";
      const hashIdx = raw.indexOf("#");
      if (hashIdx === -1) return;
      const id = raw.slice(hashIdx + 1);
      if (!id) return;

      const dest = document.getElementById(id);
      if (!dest) return;

      e.preventDefault();
      dest.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  return null;
}
