"use client";

import { useEffect } from "react";

// Replaces app.js sub-expr #5: the booking modal (#bm). Closes on backdrop click or any
// .bmx/#bmgo element click, matching legacy behavior.
export default function BookingModal() {
  useEffect(() => {
    const modal = document.getElementById("bm");
    if (!modal) return;

    function open() {
      modal!.classList.add("open");
      document.body.classList.add("modal-open");
    }

    function close() {
      modal!.classList.remove("open");
      document.body.classList.remove("modal-open");
    }

    function onDocClick(e: MouseEvent) {
      const t = e.target as HTMLElement;
      if (t.closest("[data-bm-open]")) {
        e.preventDefault();
        open();
        return;
      }
      if (t === modal || t.closest(".bmx") || t.closest("#bmgo")) {
        close();
      }
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && modal!.classList.contains("open")) close();
    }

    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown);
    return () => {
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return null;
}
