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

// Replaces the click-tracking half of the legacy "lead-plan" bundle statement: fires GA/GTM
// events for tel: links, WhatsApp links, and booking/calendar links (calendar.app.google,
// calendly.com, or any .btn with data-route="contact").
export default function ClickAnalytics() {
  useEffect(() => {
    function onClick(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest<HTMLAnchorElement>("a");
      if (!a) return;
      const h = a.getAttribute("href") || "";
      if (/^tel:/i.test(h)) {
        ev("click_to_call", { link_url: h });
      } else if (/wa\.me|whatsapp\.com/i.test(h)) {
        ev("whatsapp_click", { link_url: h });
      } else if (
        /calendar\.app\.google|calendly\.com/i.test(h) ||
        (a.classList.contains("btn") && a.getAttribute("data-route") === "contact")
      ) {
        ev("book_call_click", { link_text: (a.textContent || "").trim().slice(0, 60) });
      }
    }

    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  return null;
}
