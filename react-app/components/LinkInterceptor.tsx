"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Replaces the legacy site's hand-written 195KB pushState router. Mounted once in the root
 * layout, this delegates clicks on the whole document: any plain internal <a href> anywhere in
 * the page (Header, Footer, mega menu, page content — all still rendered as raw HTML from the
 * legacy markup) gets intercepted and sent through Next.js's real router instead of causing a
 * full page reload. External links, download links, target="_blank", modified clicks (cmd/ctrl/
 * shift/middle-click) and plain #hash anchors are all left alone to behave natively.
 */
export default function LinkInterceptor() {
  const router = useRouter();

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented) return;
      if (e.button !== 0) return; // only plain left-click
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return; // let the browser open in new tab/window

      const target = e.target as HTMLElement | null;
      const a = target?.closest("a[href]") as HTMLAnchorElement | null;
      if (!a) return;

      // Respect explicit opt-outs
      if (a.target && a.target !== "_self") return;
      if (a.hasAttribute("download")) return;
      if (a.dataset.noRouter !== undefined) return;

      const href = a.getAttribute("href") || "";
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return;

      let url: URL;
      try {
        url = new URL(href, window.location.href);
      } catch {
        return;
      }
      if (url.origin !== window.location.origin) return; // external link, let it navigate normally

      // Same-page hash link (href="/about/#section" while already on /about/) — let the
      // browser handle in-page scrolling instead of a router navigation.
      if (
        url.pathname === window.location.pathname &&
        url.search === window.location.search &&
        url.hash
      ) {
        return;
      }

      e.preventDefault();
      router.push(url.pathname + url.search + url.hash);
    }

    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, [router]);

  return null;
}
