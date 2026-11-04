"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const LOCALE_PREFIXES = ["fr", "de", "ar", "zh", "ja", "es-mx", "es-es", "pt-pt"];

function normalize(path: string): string {
  let p = path.replace(
    new RegExp(`^/(${LOCALE_PREFIXES.join("|")})(?=/|$)`),
    ""
  );
  p = p.replace(/\/+$/, "");
  return p + "/";
}

// Replaces the legacy nav-here-js script with the same matching logic, but driven by Next's
// router state (usePathname) instead of re-parsing location on every DOMContentLoaded.
export default function NavHere() {
  const pathname = usePathname();

  useEffect(() => {
    const cur = normalize(pathname || "/");
    const seg = cur.split("/")[1] || "";

    document
      .querySelectorAll<HTMLElement>(
        '[data-here], [aria-current="page"]'
      )
      .forEach((el) => {
        el.removeAttribute("data-here");
        if (el.getAttribute("aria-current") === "page") {
          el.removeAttribute("aria-current");
        }
      });

    document
      .querySelectorAll<HTMLAnchorElement>(
        ".links a[href], .mnav>a[href], .mnav .mn-it[href]"
      )
      .forEach((a) => {
        const raw = a.getAttribute("href") || "";
        if (raw.indexOf("#") > -1) return;
        let h: string;
        try {
          h = normalize(new URL(raw, window.location.href).pathname);
        } catch {
          return;
        }
        const hs = h.split("/")[1] || "";
        const isMnIt = a.classList.contains("mn-it");
        const on = isMnIt ? h === cur : hs === seg && (hs !== "" || cur === "/");
        if (on) {
          a.setAttribute("data-here", "");
          if (h === cur) a.setAttribute("aria-current", "page");
        }
      });

    if (/^(services|marketing|automation)$/.test(seg)) {
      document
        .querySelectorAll<HTMLElement>(".svbtn, .mn-sv>summary")
        .forEach((b) => b.setAttribute("data-here", ""));
    }
  }, [pathname]);

  return null;
}
