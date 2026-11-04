"use client";

import { useEffect } from "react";

declare global {
  interface Window {
    pmsT?: (s: string) => string;
  }
}

type FormKind = "contact" | "newsletter";

const ENDPOINTS: Record<FormKind, string> = {
  contact: "/api/contact.php",
  newsletter: "/api/newsletter.php",
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const GENERIC_EMAIL_ERROR = "Please enter a valid email address.";

function sanitize(value: unknown, maxLen: number, allowNewlines?: boolean): string {
  let s = String(value == null ? "" : value).replace(
    allowNewlines ? /[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g : /[\u0000-\u001f\u007f]/g,
    " "
  );
  if (!allowNewlines) s = s.replace(/\s+/g, " ");
  return s.trim().slice(0, maxLen);
}

function setStatus(el: HTMLElement | null, text: string, cls: string) {
  if (!el) return;
  el.textContent = text;
  el.hidden = false;
  el.classList.remove("ok", "err");
  if (cls) el.classList.add(cls);
}

function clearFieldErrors(form: HTMLFormElement) {
  form.querySelectorAll(".ferr").forEach((e) => e.parentNode?.removeChild(e));
  form.querySelectorAll("[aria-invalid]").forEach((e) => {
    e.removeAttribute("aria-invalid");
    const describedBy = e.getAttribute("aria-describedby") || "";
    if (/-err$|^nlmsg$/.test(describedBy)) e.removeAttribute("aria-describedby");
  });
}

function t(s: string): string {
  try {
    return window.pmsT ? window.pmsT(s) : s;
  } catch {
    return s;
  }
}

function classify(form: Element | null): FormKind | null {
  if (!form || (form as HTMLElement).tagName !== "FORM") return null;
  const f = form as HTMLFormElement;
  if (f.id === "cf") return "contact";
  if (f.getAttribute("data-form") === "newsletter") return "newsletter";
  return null;
}

// Replaces app.js sub-expr #11: the full contact-page form (#cf, fields n/e/p/c/b/s/m) and any
// newsletter sign-up form ([data-form="newsletter"], email only) — per-field inline error spans,
// ARIA wiring, a "still sending" delayed status message, and posting to /api/contact.php or
// /api/newsletter.php respectively. Kept separate from LeadPlanForm.tsx, which is the simpler,
// single-status-message homepage "Get Free Growth Plan" form (.lp-form) — two distinct legacy
// handlers, preserved as two distinct components.
export default function SiteForm() {
  useEffect(() => {
    function fieldValue(form: HTMLFormElement, name: string): string {
      const el = (form.elements as unknown as Record<string, HTMLInputElement | undefined>)[name];
      return el ? el.value : "";
    }

    function showFieldError(form: HTMLFormElement, statusEl: HTMLElement | null, name: string, msg: string) {
      setStatus(statusEl, "", "");
      const el = (form.elements as unknown as Record<string, HTMLInputElement | undefined>)[name];
      if (!el) return;
      const label = el.closest("label");
      const errId = el.id + "-err";
      let errEl = document.getElementById(errId);
      if (!errEl) {
        errEl = document.createElement("span");
        errEl.id = errId;
        errEl.className = "ferr";
        (label || el).insertAdjacentElement("afterend", errEl);
      }
      errEl.textContent = "Error: " + msg;
      el.setAttribute("aria-invalid", "true");
      el.setAttribute("aria-describedby", errId);
      el.focus();
    }

    function submitForm(form: HTMLFormElement, kind: FormKind) {
      if (form.dataset.busy === "1") return;

      const submitBtn = form.querySelector<HTMLButtonElement>("button[type=submit]");
      const statusEl: HTMLElement | null =
        kind === "contact" ? document.getElementById("cn") : (form.parentNode as HTMLElement | null)?.querySelector(".nlmsg") || null;

      let payload: Record<string, unknown>;

      if (kind === "contact") {
        const name = sanitize(fieldValue(form, "n"), 120);
        const email = sanitize(fieldValue(form, "e"), 200).toLowerCase();
        const phone = sanitize(fieldValue(form, "p"), 40);

        clearFieldErrors(form);
        setStatus(statusEl, "", "");

        if (name.length < 2) return showFieldError(form, statusEl, "n", "Please enter your name.");
        if (!email) return showFieldError(form, statusEl, "e", "Email address is required.");
        if (!EMAIL_RE.test(email)) return showFieldError(form, statusEl, "e", GENERIC_EMAIL_ERROR);
        if (!phone) return showFieldError(form, statusEl, "p", "Phone number is required.");
        if (!/^[0-9+()\-.\s]+$/.test(phone) || phone.replace(/\D/g, "").length < 6 || phone.replace(/\D/g, "").length > 20) {
          return showFieldError(form, statusEl, "p", "Please enter a valid phone number.");
        }

        const company = sanitize(fieldValue(form, "c"), 160);
        const btype = sanitize(fieldValue(form, "b"), 120);
        if (company.length < 2) return showFieldError(form, statusEl, "c", t("Please enter your company name."));
        if (!btype) return showFieldError(form, statusEl, "b", t("Please choose your business type."));

        payload = {
          type: "contact",
          name,
          email,
          phone,
          company,
          btype,
          interest: sanitize(fieldValue(form, "s"), 120),
          message: sanitize(fieldValue(form, "m"), 2000, true),
        };
      } else {
        const email = sanitize(fieldValue(form, "email"), 200).toLowerCase();
        clearFieldErrors(form);
        if (!EMAIL_RE.test(email)) {
          setStatus(statusEl, GENERIC_EMAIL_ERROR, "err");
          const f = (form.elements as unknown as Record<string, HTMLInputElement | undefined>).email;
          if (f) {
            f.setAttribute("aria-invalid", "true");
            f.setAttribute("aria-describedby", "nlmsg");
            f.focus();
          }
          return;
        }
        payload = { type: "newsletter", email };
      }

      payload.website = sanitize(fieldValue(form, "website"), 200);
      payload.page = sanitize(location.href, 500);
      payload.el = (() => {
        try {
          return Math.round(performance.now());
        } catch {
          return 0;
        }
      })();
      payload.id =
        form.dataset.sid ||
        (form.dataset.sid = (() => {
          try {
            if (window.crypto && "randomUUID" in window.crypto) return window.crypto.randomUUID();
          } catch {
            // ignore
          }
          return Date.now() + "-" + Math.random().toString(16).slice(2);
        })());

      form.dataset.busy = "1";
      form.setAttribute("aria-busy", "true");
      submitBtn?.setAttribute("aria-disabled", "true");
      setStatus(statusEl, "Sending...", "");

      const stillSendingTimer = setTimeout(() => {
        setStatus(statusEl, "Still sending... please keep this page open.", "");
      }, 8000);

      const endpoint = ENDPOINTS[(payload.type as FormKind) || kind];

      new Promise<Record<string, unknown>>((resolve, reject) => {
        if (!endpoint) return reject(new Error("unknown form"));
        fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
          credentials: "same-origin",
        })
          .then((r) =>
            r.text().then((text) => {
              let j: Record<string, unknown> | null = null;
              try {
                j = JSON.parse(text);
              } catch {
                // not JSON, fall back to text sniff below
              }
              return { ok: r.ok, j, text };
            })
          )
          .then(({ ok, j, text }) => {
            if (ok && ((j && j.ok === true) || (!j && /"ok"\s*:\s*true/.test(text)))) {
              resolve(j || { ok: true });
            } else {
              reject(new Error("not sent"));
            }
          })
          .catch(reject);
      })
        .then(() => {
          form.reset();
          delete form.dataset.sid;
          setStatus(
            statusEl,
            kind === "contact"
              ? "Thanks! Your message has been sent. We'll get back to you shortly."
              : "You're subscribed. Thanks for joining us.",
            "ok"
          );
        })
        .catch(() => {
          setStatus(statusEl, "Something went wrong. Please try again.", "err");
        })
        .then(() => {
          clearTimeout(stillSendingTimer);
          form.dataset.busy = "0";
          form.removeAttribute("aria-busy");
          submitBtn?.removeAttribute("aria-disabled");
        });
    }

    function onClick(e: MouseEvent) {
      const btn = (e.target as HTMLElement | null)?.closest<HTMLButtonElement>("button[type=submit]");
      if (!btn) return;
      const form = btn.form || btn.closest("form");
      const kind = classify(form);
      if (kind && form) {
        e.preventDefault();
        submitForm(form as HTMLFormElement, kind);
      }
    }

    function onSubmit(e: SubmitEvent) {
      const kind = classify(e.target as Element | null);
      if (kind) {
        e.preventDefault();
        submitForm(e.target as HTMLFormElement, kind);
      }
    }

    document.addEventListener("click", onClick);
    document.addEventListener("submit", onSubmit as EventListener);
    return () => {
      document.removeEventListener("click", onClick);
      document.removeEventListener("submit", onSubmit as EventListener);
    };
  }, []);

  return null;
}
