"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

declare global {
  interface Window {
    pmsSay?: (text: string) => void;
    pmsSetMotion?: (reduce: boolean, persist?: boolean) => void;
    pmsMotionOn?: () => boolean;
    pmsNames?: (root?: ParentNode) => void;
  }
  interface HTMLDialogElement {
    __opener?: Element | null;
  }
}

const VAGUE_LINK_TEXT =
  /^(read more|learn more|discuss|view details|visit website|visit site|read insight|read full quote|explore|get started|more details?)$/i;

// Replaces app.js sub-expr #8: the accessibility live-region announcer + a grab-bag of related
// a11y behaviors (skip-link focus, dialog focus-trap/opener-restore, reduced-motion toggle,
// auto aria-labels for vague link text). Also replicates what the legacy router used to do on
// every soft-navigation via its window.pmsRouted() callback (announce the new page title and
// focus #main-content) — now driven by usePathname() instead, since Next's own router replaced
// the legacy one and nothing calls pmsRouted() anymore.
export default function AccessibilityAnnouncer() {
  const pathname = usePathname();
  const hasNavigatedRef = useRef(false);

  // One-time setup: live-region announcer, skip-link, dialog focus-trap/opener restore,
  // motion toggle, and an aria-label fixup pass + observer for the current page.
  useEffect(() => {
    const live = document.getElementById("a11yLive");
    const root = document.documentElement;

    function say(text: string) {
      if (!live) return;
      live.textContent = "";
      setTimeout(() => {
        live.textContent = text;
      }, 80);
    }
    window.pmsSay = say;

    function onSkipLinkClick(e: MouseEvent) {
      const a = (e.target as HTMLElement | null)?.closest?.("a.skip-link");
      if (!a) return;
      e.preventDefault();
      const main = document.getElementById("main-content");
      main?.focus();
      main?.scrollIntoView();
    }
    document.addEventListener("click", onSkipLinkClick);

    // Remember the element that opened a <dialog> and restore focus to it on close.
    let lastInteractive: Element | null = null;
    function trackInteractive(e: Event) {
      const t = (e.target as HTMLElement | null)?.closest?.("a,button,[data-open],summary");
      if (t) lastInteractive = t;
    }
    document.addEventListener("pointerdown", trackInteractive, true);
    document.addEventListener("keydown", trackInteractive, true);

    let restoreShowModal: (() => void) | null = null;
    function onDialogClose(e: Event) {
      const t = e.target as HTMLDialogElement;
      if (t?.tagName === "DIALOG" && t.__opener && document.contains(t.__opener)) {
        try {
          (t.__opener as HTMLElement).focus();
        } catch {
          // ignore
        }
      }
    }
    if (window.HTMLDialogElement) {
      const original = HTMLDialogElement.prototype.showModal;
      HTMLDialogElement.prototype.showModal = function (this: HTMLDialogElement) {
        const active = document.activeElement;
        this.__opener = active && active !== document.body && active !== this ? active : lastInteractive;
        return original.apply(this, []);
      };
      document.addEventListener("close", onDialogClose, true);
      restoreShowModal = () => {
        HTMLDialogElement.prototype.showModal = original;
      };
    }

    function onTabTrap(e: KeyboardEvent) {
      if (e.key !== "Tab") return;
      const dlg = document.querySelector<HTMLElement>("dialog[open]");
      if (!dlg) return;
      const focusable = Array.from(
        dlg.querySelectorAll<HTMLElement>(
          'a[href],button:not([disabled]),input:not([type=hidden]),select,textarea,summary,[tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => el.offsetWidth > 0 || el.offsetHeight > 0);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;
      if (!e.shiftKey && active === last) {
        e.preventDefault();
        first.focus();
      } else if (e.shiftKey && (active === first || !dlg.contains(active))) {
        e.preventDefault();
        last.focus();
      }
    }
    document.addEventListener("keydown", onTabTrap);

    // Reduced-motion toggle
    const motionBtn = document.getElementById("motionToggle");
    function motionOn() {
      return root.getAttribute("data-motion") === "reduce";
    }
    function setMotion(reduce: boolean, persist?: boolean) {
      if (reduce) root.setAttribute("data-motion", "reduce");
      else root.removeAttribute("data-motion");
      motionBtn?.setAttribute("aria-pressed", reduce ? "true" : "false");
      if (reduce) {
        document.querySelectorAll<HTMLElement>('main button[aria-pressed="false"]').forEach((el) => {
          if (/^Pause/.test((el.textContent || "").trim())) el.click();
        });
      }
      if (persist) {
        try {
          localStorage.setItem("pms-motion", reduce ? "reduce" : "play");
        } catch {
          // ignore storage errors
        }
        say(reduce ? "Animations paused" : "Animations on");
      }
      document.dispatchEvent(new Event("pms-motion"));
    }
    window.pmsSetMotion = setMotion;
    window.pmsMotionOn = motionOn;
    function onMotionClick() {
      setMotion(!motionOn(), true);
    }
    if (motionBtn) {
      motionBtn.setAttribute("aria-pressed", motionOn() ? "true" : "false");
      motionBtn.addEventListener("click", onMotionClick);
    }

    // Auto aria-label for ambiguous link/button text ("Read more", "Learn more", etc.)
    function fixNames(scope: ParentNode = document) {
      scope.querySelectorAll<HTMLElement>("a,button").forEach((el) => {
        if (el.hasAttribute("data-a11y")) return;
        const text = (el.textContent || "").replace(/[↗→›×]/g, "").replace(/\(opens in a new tab\)/i, "").replace(/\s+/g, " ").trim();
        let label = el.getAttribute("aria-label") || "";
        if (!label && VAGUE_LINK_TEXT.test(text)) {
          const container = el.closest("article,.card,.pcard,.relc,.tcard,.gw,.hl,li") || el.parentElement;
          const heading = container?.querySelector("h2,h3,h4,figcaption b,.pt");
          const headingText = heading?.textContent?.replace(/\s+/g, " ").trim() || "";
          if (headingText) {
            label = /^(read more|learn more)$/i.test(text) ? `${text} about ${headingText}` : `${text}: ${headingText}`;
          }
        }
        if (el.getAttribute("target") === "_blank" && !/new tab/i.test(text + (label || ""))) {
          label = `${label || text} (opens in a new tab)`;
        }
        if (label && label !== el.getAttribute("aria-label")) el.setAttribute("aria-label", label);
        el.setAttribute("data-a11y", "1");
      });
    }
    window.pmsNames = fixNames;

    let raf = 0;
    function scheduleFixNames() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        fixNames(document);
      });
    }
    const mainEl = document.getElementById("main-content");
    let observer: MutationObserver | undefined;
    if (mainEl && "MutationObserver" in window) {
      observer = new MutationObserver(scheduleFixNames);
      observer.observe(mainEl, { childList: true, subtree: true });
    }
    fixNames(document);

    return () => {
      document.removeEventListener("click", onSkipLinkClick);
      document.removeEventListener("pointerdown", trackInteractive, true);
      document.removeEventListener("keydown", trackInteractive, true);
      document.removeEventListener("close", onDialogClose, true);
      document.removeEventListener("keydown", onTabTrap);
      motionBtn?.removeEventListener("click", onMotionClick);
      restoreShowModal?.();
      observer?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Per-route: announce the new page + focus #main-content, matching what the legacy router's
  // pmsRouted() callback used to do — but skip on the very first render (that's a hard
  // navigation, not a soft one, so there's nothing to announce).
  useEffect(() => {
    if (!hasNavigatedRef.current) {
      hasNavigatedRef.current = true;
      return;
    }
    const main = document.getElementById("main-content");
    if (main) {
      try {
        main.focus({ preventScroll: true });
      } catch {
        main.focus();
      }
      window.pmsSay?.(`Page loaded: ${document.title.replace(/\s*\|.*$/, "")}`);
    }
  }, [pathname]);

  return null;
}
