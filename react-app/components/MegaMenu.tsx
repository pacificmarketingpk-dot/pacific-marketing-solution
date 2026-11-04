"use client";

import { useEffect } from "react";

// Replaces the legacy app.js's two standalone mega-menu IIFEs (click/keyboard toggle + hover
// open/close). The menu's internal tab-switching and "included services" preview panel are a
// separate, untouched piece of app.js (keyed off the same .mg-it/data-inc markup) and keep
// working unchanged — this component only owns opening and closing the panel itself.
export default function MegaMenu() {
  useEffect(() => {
    const btn = document.querySelector<HTMLButtonElement>(".svbtn");
    const menu = document.getElementById("mega");
    if (!btn || !menu) return;

    function setOpen(open: boolean) {
      menu!.classList.toggle("open", open);
      btn!.setAttribute("aria-expanded", String(open));
    }

    function onBtnClick(e: MouseEvent) {
      const wasOpen = menu!.classList.contains("open");
      setOpen(!wasOpen);
      if (!wasOpen && e.detail === 0) {
        // keyboard-activated (Enter/Space) — focus first link
        const first = menu!.querySelector<HTMLElement>("a");
        first?.focus();
      }
    }

    function onBtnKeydown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setOpen(true);
        menu!.querySelector<HTMLElement>("a")?.focus();
      }
    }

    function onMenuKeydown(e: KeyboardEvent) {
      if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
      const links = Array.from(menu!.querySelectorAll<HTMLElement>("a"));
      const i = links.indexOf(document.activeElement as HTMLElement);
      e.preventDefault();
      let next: number;
      if (e.key === "ArrowDown") next = (i + 1) % links.length;
      else if (e.key === "ArrowUp") next = (i - 1 + links.length) % links.length;
      else if (e.key === "Home") next = 0;
      else next = links.length - 1;
      links[next]?.focus();
    }

    function onMenuClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest("a")) setOpen(false);
    }

    function onDocClick(e: MouseEvent) {
      const t = e.target as Node;
      if (!menu!.contains(t) && t !== btn) setOpen(false);
    }

    function onDocKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && menu!.classList.contains("open")) {
        setOpen(false);
        btn!.focus();
      }
    }

    function onMenuFocusout(e: FocusEvent) {
      if (
        menu!.classList.contains("open") &&
        e.relatedTarget &&
        !menu!.contains(e.relatedTarget as Node) &&
        e.relatedTarget !== btn
      ) {
        setOpen(false);
      }
    }

    btn.addEventListener("click", onBtnClick);
    btn.addEventListener("keydown", onBtnKeydown);
    menu.addEventListener("keydown", onMenuKeydown);
    menu.addEventListener("click", onMenuClick);
    document.addEventListener("click", onDocClick);
    document.addEventListener("keydown", onDocKeydown);
    menu.addEventListener("focusout", onMenuFocusout);

    // Hover-to-open on fine-pointer devices
    let hoverTimer: ReturnType<typeof setTimeout>;
    let hoverOpened = false;
    const canHover =
      typeof window.matchMedia === "function" &&
      window.matchMedia("(hover:hover) and (pointer:fine)").matches;

    function onMouseEnter() {
      clearTimeout(hoverTimer);
      if (!menu!.classList.contains("open")) {
        hoverOpened = true;
        setOpen(true);
      }
    }
    function onMouseLeave() {
      clearTimeout(hoverTimer);
      hoverTimer = setTimeout(() => {
        hoverOpened = false;
        setOpen(false);
      }, 250);
    }
    function onMenuMouseEnter() {
      clearTimeout(hoverTimer);
    }
    function onBtnClickCapture(e: MouseEvent) {
      if (hoverOpened && menu!.classList.contains("open") && e.detail !== 0) {
        hoverOpened = false;
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    }
    let observer: MutationObserver | undefined;

    if (canHover) {
      btn.addEventListener("mouseenter", onMouseEnter);
      btn.addEventListener("mouseleave", onMouseLeave);
      menu.addEventListener("mouseenter", onMenuMouseEnter);
      menu.addEventListener("mouseleave", onMouseLeave);
      btn.addEventListener("click", onBtnClickCapture, true);
      observer = new MutationObserver(() => {
        if (!menu!.classList.contains("open")) hoverOpened = false;
      });
      observer.observe(menu, { attributes: true, attributeFilter: ["class"] });
    }

    return () => {
      btn.removeEventListener("click", onBtnClick);
      btn.removeEventListener("keydown", onBtnKeydown);
      menu.removeEventListener("keydown", onMenuKeydown);
      menu.removeEventListener("click", onMenuClick);
      document.removeEventListener("click", onDocClick);
      document.removeEventListener("keydown", onDocKeydown);
      menu.removeEventListener("focusout", onMenuFocusout);
      if (canHover) {
        btn.removeEventListener("mouseenter", onMouseEnter);
        btn.removeEventListener("mouseleave", onMouseLeave);
        menu.removeEventListener("mouseenter", onMenuMouseEnter);
        menu.removeEventListener("mouseleave", onMouseLeave);
        btn.removeEventListener("click", onBtnClickCapture, true);
        observer?.disconnect();
      }
      clearTimeout(hoverTimer);
    };
  }, []);

  return null;
}
