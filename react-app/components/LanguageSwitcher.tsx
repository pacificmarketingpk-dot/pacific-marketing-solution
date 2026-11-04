"use client";

import { useEffect } from "react";

const LANGS: Record<string, { n: string; c: string; dir: "ltr" | "rtl" }> = {
  en: { n: "English", c: "EN", dir: "ltr" },
  fr: { n: "Français", c: "FR", dir: "ltr" },
  de: { n: "Deutsch", c: "DE", dir: "ltr" },
  ar: { n: "العربية", c: "AR", dir: "rtl" },
  "zh-CN": { n: "中文", c: "ZH", dir: "ltr" },
  ja: { n: "日本語", c: "JA", dir: "ltr" },
  "es-MX": { n: "Español (MX)", c: "ES", dir: "ltr" },
  "es-ES": { n: "Español (ES)", c: "ES", dir: "ltr" },
  "pt-PT": { n: "Português", c: "PT", dir: "ltr" },
};

// Replaces app.js sub-expr #10 (the legacy language switcher). Rather than re-deriving a
// route-mapping table client-side (which is what the old globals set by sub-expr #1 the router
// were for), this reads the hreflang <link rel="alternate"> tags Next.js already renders
// correctly per-page from each page's Metadata.alternates.languages — so the mapping is always
// exactly right for the CURRENT page, with zero duplicated routing data.
export default function LanguageSwitcher() {
  useEffect(() => {
    const btn = document.getElementById("langBtn");
    const menu = document.getElementById("langMenu");
    if (!btn || !menu) return;

    function hreflangMap(): Record<string, string> {
      const map: Record<string, string> = {};
      document
        .querySelectorAll<HTMLLinkElement>('link[rel="alternate"][hreflang]')
        .forEach((link) => {
          const hl = link.hreflang;
          if (hl && hl !== "x-default") map[hl] = link.href;
        });
      return map;
    }

    function render() {
      const map = hreflangMap();
      menu!.innerHTML = "";
      Object.keys(LANGS).forEach((code) => {
        const href = map[code];
        if (!href) return; // this page has no translated counterpart for this locale
        const info = LANGS[code];
        const a = document.createElement("a");
        a.href = href;
        a.hreflang = code;
        a.dir = info.dir;
        a.textContent = info.n;
        a.className = "lang-item";
        menu!.appendChild(a);
      });
    }

    function setOpen(open: boolean) {
      menu!.classList.toggle("open", open);
      btn!.setAttribute("aria-expanded", String(open));
      if (open) render();
    }

    function onBtnClick() {
      setOpen(!menu!.classList.contains("open"));
    }

    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!menu!.contains(t) && t !== btn) setOpen(false);
    }

    function onKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && menu!.classList.contains("open")) {
        setOpen(false);
        btn!.focus();
      }
    }

    btn.addEventListener("click", onBtnClick);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onKeydown);
    return () => {
      btn.removeEventListener("click", onBtnClick);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onKeydown);
    };
  }, []);

  return null;
}
