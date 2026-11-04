"use client";

import { useEffect } from "react";

// Replaces app.js sub-expr #3: mobile burger-menu open/close.
export default function MobileNav() {
  useEffect(() => {
    const burger = document.querySelector<HTMLElement>(".burger");
    const mnav = document.getElementById("mnav");
    if (!burger || !mnav) return;

    function setOpen(open: boolean) {
      mnav!.classList.toggle("open", open);
      burger!.classList.toggle("open", open);
      burger!.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
    }

    function onBurgerClick() {
      setOpen(!mnav!.classList.contains("open"));
    }

    function onNavClick(e: MouseEvent) {
      if ((e.target as HTMLElement).closest("a")) setOpen(false);
    }

    function onDocKeydown(e: KeyboardEvent) {
      if (e.key === "Escape" && mnav!.classList.contains("open")) {
        setOpen(false);
        burger!.focus();
      }
    }

    burger.addEventListener("click", onBurgerClick);
    mnav.addEventListener("click", onNavClick);
    document.addEventListener("keydown", onDocKeydown);

    return () => {
      burger.removeEventListener("click", onBurgerClick);
      mnav.removeEventListener("click", onNavClick);
      document.removeEventListener("keydown", onDocKeydown);
    };
  }, []);

  return null;
}
