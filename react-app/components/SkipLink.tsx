// Restores the skip-to-content link that sits at the very top of <body> in the legacy markup
// (before <header>, outside both the <header> and <main> ranges that Phase 1-3's convert_page.py
// captured — it was dropped by that conversion). Text is translated per locale, same as the
// legacy per-file static HTML, so each locale layout passes its own string.
export default function SkipLink({ text }: { text: string }) {
  return (
    <a className="skip-link" href="#main-content">
      {text}
    </a>
  );
}
