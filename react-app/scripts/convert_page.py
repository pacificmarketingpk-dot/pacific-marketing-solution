#!/usr/bin/env python3
"""
Converts one legacy static HTML page (from the repo, NOT the live site — see conversation
notes on why) into a Next.js App Router page.tsx with a typed Metadata export plus the page's
unique <main> content preserved verbatim via dangerouslySetInnerHTML (Phase 1-3 of the React
migration; Phase 4 breaks content into real JSX).

Usage: convert_page.py <source-html-relative-to-repo-root> <app-route e.g. "about">
"""
import sys
import re
import json
import html as htmlmod
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[2]
APP_DIR = Path(__file__).resolve().parents[1] / "app"


def text_between(src, pattern, group=1, required=False):
    m = re.search(pattern, src, re.S)
    if not m:
        if required:
            raise ValueError(f"pattern not found: {pattern[:60]}")
        return None
    return htmlmod.unescape(m.group(group))


def extract(src):
    data = {}
    data["title"] = text_between(src, r"<title>(.*?)</title>", required=True)
    data["description"] = text_between(
        src, r'<meta name="description" content="([^"]*)"'
    )
    data["canonical"] = text_between(
        src, r'<link rel="canonical" href="([^"]*)"'
    )
    robots = text_between(src, r'<meta name="robots" content="([^"]*)"')
    data["robots_raw"] = robots

    # hreflang alternates
    langs = {}
    for m in re.finditer(
        r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"', src
    ):
        langs[m.group(1)] = htmlmod.unescape(m.group(2))
    data["hreflang"] = langs

    # Open Graph
    og = {}
    for m in re.finditer(r'<meta property="(og:[a-z:]+)" content="([^"]*)"', src):
        og[m.group(1)] = htmlmod.unescape(m.group(2))
    data["og"] = og

    # Twitter
    tw = {}
    for m in re.finditer(r'<meta name="(twitter:[a-z:]+)" content="([^"]*)"', src):
        tw[m.group(1)] = htmlmod.unescape(m.group(2))
    data["twitter"] = tw

    # JSON-LD blocks (id -> raw json string)
    ld = {}
    for m in re.finditer(
        r'<script type="application/ld\+json"(?:\s+id="([^"]+)")?>(.*?)</script>',
        src,
        re.S,
    ):
        key = m.group(1) or f"ld{len(ld)}"
        ld[key] = m.group(2).strip()
    data["ld"] = ld

    # main content
    main_m = re.search(r"<main\b.*?</main>", src, re.S)
    if not main_m:
        raise ValueError("no <main> found")
    data["main"] = main_m.group(0)

    return data


def build_metadata_ts(data):
    lines = []
    lines.append("const TITLE = " + json.dumps(data["title"]) + ";")
    if data["description"]:
        lines.append("const DESCRIPTION = " + json.dumps(data["description"]) + ";")
    lines.append("")
    lines.append("export const metadata: Metadata = {")
    lines.append("  title: TITLE,")
    if data["description"]:
        lines.append("  description: DESCRIPTION,")

    alt_lines = []
    if data["canonical"]:
        alt_lines.append(f"    canonical: {json.dumps(data['canonical'])},")
    if data["hreflang"]:
        alt_lines.append("    languages: {")
        for k, v in data["hreflang"].items():
            alt_lines.append(f"      {json.dumps(k)}: {json.dumps(v)},")
        alt_lines.append("    },")
    if alt_lines:
        lines.append("  alternates: {")
        lines.extend(alt_lines)
        lines.append("  },")

    if data["robots_raw"]:
        parts = [p.strip() for p in data["robots_raw"].split(",")]
        simple = {"index": True, "follow": True}
        extra = []
        for p in parts:
            if p == "noindex":
                simple["index"] = False
            elif p == "nofollow":
                simple["follow"] = False
            elif p == "index" or p == "follow":
                pass
            elif ":" in p:
                k, v = p.split(":", 1)
                extra.append((k.strip(), v.strip()))
        lines.append("  robots: {")
        lines.append(f"    index: {str(simple['index']).lower()},")
        lines.append(f"    follow: {str(simple['follow']).lower()},")
        for k, v in extra:
            try:
                vv = int(v)
            except ValueError:
                vv = json.dumps(v)
            lines.append(f"    {json.dumps(k)}: {vv},")
        lines.append("  },")

    if data["og"]:
        lines.append("  openGraph: {")
        if "og:type" in data["og"]:
            lines.append(f"    type: {json.dumps(data['og']['og:type'])} as const,")
        if "og:url" in data["og"]:
            lines.append(f"    url: {json.dumps(data['og']['og:url'])},")
        lines.append("    title: TITLE,")
        if data["description"]:
            lines.append("    description: DESCRIPTION,")
        if "og:site_name" in data["og"]:
            lines.append(f"    siteName: {json.dumps(data['og']['og:site_name'])},")
        if "og:locale" in data["og"]:
            lines.append(f"    locale: {json.dumps(data['og']['og:locale'])},")
        if "og:image" in data["og"]:
            img = {"url": data["og"]["og:image"]}
            if "og:image:width" in data["og"]:
                img["width"] = int(data["og"]["og:image:width"])
            if "og:image:height" in data["og"]:
                img["height"] = int(data["og"]["og:image:height"])
            if "og:image:alt" in data["og"]:
                img["alt"] = data["og"]["og:image:alt"]
            lines.append("    images: [" + json.dumps(img) + "],")
        lines.append("  },")

    if data["twitter"]:
        lines.append("  twitter: {")
        if "twitter:card" in data["twitter"]:
            lines.append(f"    card: {json.dumps(data['twitter']['twitter:card'])} as const,")
        lines.append("    title: TITLE,")
        if data["description"]:
            lines.append("    description: DESCRIPTION,")
        if "twitter:image" in data["twitter"]:
            lines.append(f"    images: [{json.dumps(data['twitter']['twitter:image'])}],")
        lines.append("  },")

    lines.append("};")
    return "\n".join(lines)


def build_page_tsx(data):
    meta_ts = build_metadata_ts(data)
    ld_scripts = []
    for key, content in data["ld"].items():
        ld_scripts.append(
            f'      <Script\n'
            f'        id={json.dumps(key)}\n'
            f'        type="application/ld+json"\n'
            f'        dangerouslySetInnerHTML={{{{ __html: {json.dumps(content)} }}}}\n'
            f'      />'
        )
    ld_block = "\n".join(ld_scripts)

    return f'''import type {{ Metadata }} from "next";
import Script from "next/script";

{meta_ts}

// Phase 1-3: content rendered verbatim from the legacy page via dangerouslySetInnerHTML for
// exact parity. Phase 4 breaks this into real JSX components.
export default function Page() {{
  return (
    <>
{ld_block}
      <div
        suppressHydrationWarning
        dangerouslySetInnerHTML={{{{ __html: {json.dumps(data["main"])} }}}}
      />
    </>
  );
}}
'''


def main():
    src_rel, route = sys.argv[1], sys.argv[2]
    src_path = REPO_ROOT / src_rel
    src = src_path.read_text(encoding="utf-8")
    data = extract(src)
    tsx = build_page_tsx(data)
    out_dir = APP_DIR / route if route else APP_DIR
    out_dir.mkdir(parents=True, exist_ok=True)
    out_path = out_dir / "page.tsx"
    out_path.write_text(tsx, encoding="utf-8")
    print(f"OK {src_rel} -> {out_path.relative_to(APP_DIR.parent)}  (ld={list(data['ld'].keys())}, hreflang={len(data['hreflang'])})")


if __name__ == "__main__":
    main()
