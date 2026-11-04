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

function digitCount(s: string): number {
  return s.replace(/\D/g, "").length;
}

// Replaces the homepage "Get Free Growth Plan" lead form handler (form.lp-form): a simpler,
// single-status-message submit flow (distinct from the full contact-page form handled by
// SiteForm.tsx), fields name/phone/email/company/btype, posting to /api/contact.php.
export default function LeadPlanForm() {
  useEffect(() => {
    const t0 = Date.now(); // mirrors the legacy bundle's load-time timestamp, used as a simple elapsed-time bot signal

    function onSubmit(e: SubmitEvent) {
      const f = e.target as HTMLFormElement | null;
      if (!f || !f.classList.contains("lp-form")) return;
      e.preventDefault();
      if (f.dataset.busy === "1") return;

      const g = (n: string) => ((f.elements as unknown as Record<string, HTMLInputElement>)[n]?.value || "").trim();
      const m = f.querySelector<HTMLElement>(".lp-msg");
      const d = f.dataset;

      f.querySelectorAll("[aria-invalid]").forEach((x) => x.removeAttribute("aria-invalid"));
      if (m) {
        m.className = "lp-msg";
        m.textContent = "";
      }

      function bad(name: string, msg: string | undefined) {
        const el = (f!.elements as unknown as Record<string, HTMLInputElement>)[name];
        el?.setAttribute("aria-invalid", "true");
        el?.focus();
        if (m) {
          m.className = "lp-msg bad";
          m.textContent = msg || "";
        }
      }

      const nm = g("name");
      const ph = g("phone");
      const em = g("email").toLowerCase();
      const bt = g("btype");

      if (nm.length < 2) return bad("name", d.vn);
      if (!/^[0-9+()\-.\s]{6,40}$/.test(ph) || digitCount(ph) < 6 || digitCount(ph) > 20) return bad("phone", d.vp);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)) return bad("email", d.ve);

      const companyField = (f.elements as unknown as Record<string, HTMLInputElement>).company;
      const co = companyField ? g("company") : "";
      if (companyField && co.length < 2) return bad("company", d.vc || "Please enter your company name.");
      if (!bt) return bad("btype", d.vt);

      f.dataset.busy = "1";
      const b = f.querySelector<HTMLButtonElement>("button[type=submit]");
      if (b) b.disabled = true;

      fetch("/api/contact.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: nm,
          phone: ph,
          email: em,
          company: co,
          btype: bt,
          interest: bt,
          message: `${d.msg}\nPage: ${location.pathname}`,
          website: g("website"),
          el: Date.now() - t0,
          id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
        }),
      })
        .then((r) =>
          r
            .json()
            .catch(() => ({ ok: r.ok }))
            .then((j) => r.ok && j && j.ok !== false)
        )
        .then((ok) => {
          if (ok) {
            if (m) {
              m.className = "lp-msg ok";
              m.textContent = d.ok || "";
            }
            f.reset();
            ev("generate_lead", { form_id: "growth_plan", business_type: bt });
          } else if (m) {
            m.className = "lp-msg bad";
            m.textContent = d.err || "";
          }
        })
        .catch(() => {
          if (m) {
            m.className = "lp-msg bad";
            m.textContent = d.err || "";
          }
        })
        .then(() => {
          f.dataset.busy = "";
          if (b) b.disabled = false;
        });
    }

    document.addEventListener("submit", onSubmit as EventListener, true);
    return () => document.removeEventListener("submit", onSubmit as EventListener, true);
  }, []);

  return null;
}
