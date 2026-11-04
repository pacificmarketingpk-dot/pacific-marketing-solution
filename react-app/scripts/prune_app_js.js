#!/usr/bin/env node
/**
 * Surgically removes the now-React-replaced pieces of the legacy app.f8a01924c1.js bundle,
 * using acorn to parse it into an AST and splice out exact byte ranges — far safer than a
 * regex/string edit on 400KB of minified code.
 *
 * Removed (see conversation notes for the full map of this file's structure):
 *   - Top-level statement #0  : mega-menu click/keyboard toggle      -> MegaMenu.tsx
 *   - Top-level statement #25 : mega-menu hover-to-open              -> MegaMenu.tsx
 *   - Within statement #17's SequenceExpression (13 comma-joined IIFEs):
 *       sub-expr #1  (router, ~195KB)      -> LinkInterceptor.tsx
 *       sub-expr #2  (scroll progress)     -> ScrollProgress.tsx
 *       sub-expr #3  (mobile burger nav)   -> MobileNav.tsx
 *       sub-expr #5  (booking modal)       -> BookingModal.tsx
 *       sub-expr #6  (data-anchor scroll)  -> AnchorScroll.tsx
 *       sub-expr #7  (theme toggle)        -> ThemeToggle.tsx
 *       sub-expr #10 (language switcher)   -> LanguageSwitcher.tsx
 *   Each removed sub-expression is replaced with the literal `0` so the SequenceExpression
 *   stays syntactically valid (a,b,c -> a,0,c) without shifting any other sub-expr's behavior.
 *
 * Left untouched (not yet replaced, or deliberately out of scope):
 *   - sub-expr #0 (dead code, #ftc), #4 (work-detail dialog close/video-pause — WorkDetail.tsx
 *     only wires the OPEN trigger; the dialog's own close/escape handling here still runs
 *     alongside it harmlessly... actually #4 behavior is now also covered by WorkDetail.tsx,
 *     see below), #8 (a11y announcer), #9 (a11y settings panel), #11 (form validation),
 *     #12 (Google Maps styling)
 *   - top-level statement #32 (mega-menu tab-picker / data-inc preview panel) — explicitly NOT
 *     part of the router, confirmed separate, must keep running as-is.
 */
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");

const SRC_PATH = path.join(__dirname, "..", "public", "assets", "app.f8a01924c1.js");
const src = fs.readFileSync(SRC_PATH, "utf8");

const ast = acorn.parse(src, { ecmaVersion: 2022, ranges: true });

if (ast.body.length !== 34) {
  console.error(`Expected 34 top-level statements, found ${ast.body.length}. Aborting — the map in this script's comments may be stale.`);
  process.exit(1);
}

const stmt17 = ast.body[17];
if (
  stmt17.type !== "ExpressionStatement" ||
  stmt17.expression.type !== "SequenceExpression" ||
  stmt17.expression.expressions.length !== 13
) {
  console.error("Statement #17 is not the expected 13-expression SequenceExpression. Aborting.");
  process.exit(1);
}

// Ranges to delete entirely (top-level statements #0 and #25).
const deleteTopLevel = [0, 25];
// Sub-expression indices (within statement #17) to replace with `0`.
const replaceSubExpr = [1, 2, 3, 5, 6, 7, 10];

/** @type {{start:number, end:number, text:string}[]} */
const edits = [];

for (const idx of deleteTopLevel) {
  const node = ast.body[idx];
  edits.push({ start: node.start, end: node.end, text: "" });
}

for (const idx of replaceSubExpr) {
  const node = stmt17.expression.expressions[idx];
  edits.push({ start: node.start, end: node.end, text: "0" });
}

// Apply edits back-to-front so earlier offsets stay valid.
edits.sort((a, b) => b.start - a.start);

let out = src;
for (const e of edits) {
  out = out.slice(0, e.start) + e.text + out.slice(e.end);
}

// Sanity check: re-parse the result to make sure it's still valid JS.
acorn.parse(out, { ecmaVersion: 2022 });

const OUT_PATH = path.join(__dirname, "..", "public", "assets", "app.f8a01924c1.pruned.js");
fs.writeFileSync(OUT_PATH, out);

console.log(`OK: wrote ${OUT_PATH}`);
console.log(`Original size: ${src.length} bytes`);
console.log(`Pruned size:   ${out.length} bytes`);
console.log(`Removed:       ${src.length - out.length} bytes`);
