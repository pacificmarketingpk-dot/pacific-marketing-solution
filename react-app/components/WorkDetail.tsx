"use client";

import { useEffect } from "react";

// Replaces app.js sub-expr #4: the work-detail dialog (#wd). Opening/populating its content is
// still handled by whatever triggers it in the surrounding markup (data attributes read at open
// time) — this component owns only open/close + pausing any embedded video on close, matching
// the legacy behavior exactly.
export default function WorkDetail() {
  useEffect(() => {
    const dlg = document.getElementById("wd") as HTMLDialogElement | null;
    if (!dlg) return;

    function pauseVideo() {
      dlg!.querySelectorAll<HTMLVideoElement>("video").forEach((v) => v.pause());
    }

    function openFor(trigger: HTMLElement) {
      // Legacy behavior: populate from data-* attributes on the trigger element, if present.
      const title = trigger.dataset.wdTitle;
      const body = trigger.dataset.wdBody;
      const img = trigger.dataset.wdImg;
      if (title) {
        const t = dlg!.querySelector<HTMLElement>("[data-wd-title-slot]");
        if (t) t.textContent = title;
      }
      if (body) {
        const b = dlg!.querySelector<HTMLElement>("[data-wd-body-slot]");
        if (b) b.innerHTML = body;
      }
      if (img) {
        const i = dlg!.querySelector<HTMLImageElement>("[data-wd-img-slot]");
        if (i) i.src = img;
      }
      if (typeof dlg!.showModal === "function") dlg!.showModal();
      else dlg!.setAttribute("open", "");
    }

    function onDocClick(e: MouseEvent) {
      const trigger = (e.target as HTMLElement | null)?.closest<HTMLElement>("[data-wd-open]");
      if (!trigger) return;
      e.preventDefault();
      openFor(trigger);
    }

    function onDialogClick(e: MouseEvent) {
      // Click on the backdrop (the dialog element itself, not its content) closes it.
      if (e.target === dlg) {
        pauseVideo();
        dlg!.close();
      }
      if ((e.target as HTMLElement).closest("[data-wd-close]")) {
        pauseVideo();
        dlg!.close();
      }
    }

    function onClose() {
      pauseVideo();
    }

    document.addEventListener("click", onDocClick);
    dlg.addEventListener("click", onDialogClick);
    dlg.addEventListener("close", onClose);

    return () => {
      document.removeEventListener("click", onDocClick);
      dlg.removeEventListener("click", onDialogClick);
      dlg.removeEventListener("close", onClose);
    };
  }, []);

  return null;
}
