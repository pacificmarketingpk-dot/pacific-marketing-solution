"use client";

import { useEffect } from "react";

const KEY = "pms-theme";

// Replaces app.js sub-expr #7: dark/light theme toggle with localStorage persistence.
export default function ThemeToggle() {
  useEffect(() => {
    const btn = document.getElementById("themeToggle");
    if (!btn) return;

    function apply(theme: string) {
      document.documentElement.setAttribute("data-theme", theme);
      btn!.setAttribute("aria-pressed", String(theme === "dark"));
    }

    function onClick() {
      const cur = document.documentElement.getAttribute("data-theme") || "light";
      const next = cur === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(KEY, next);
      } catch {
        // ignore storage errors (private mode, etc.)
      }
      apply(next);
    }

    // Reflect whatever the beforeInteractive theme-init script already applied,
    // so the button's aria-pressed matches on mount.
    apply(document.documentElement.getAttribute("data-theme") || "light");

    btn.addEventListener("click", onClick);
    return () => btn.removeEventListener("click", onClick);
  }, []);

  return null;
}
