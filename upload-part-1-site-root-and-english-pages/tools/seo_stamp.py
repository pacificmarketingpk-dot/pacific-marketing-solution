#!/usr/bin/env python3
"""Pacific Marketing Solution: one place for every page's SEO and social-sharing tags.

How it works
  pages.json  is the single source of truth: for every page it holds the title, description, canonical address
              (taken from the route), social image and image description.
  This script writes the same, consistent block of tags into the <head> of every page folder, and rebuilds sitemap.xml.

Add a new page
  1. Create the page as  <route>/index.html  (for example  services/new-service/index.html).
  2. Add an entry for it to pages.json  (route, title, description, image, imageAlt, type).
  3. Make its social image:   python tools/make_og_image.py --title "..." --sub "..." --kicker "SERVICE" --out images/og/<name>.jpg
  4. Run:                     python tools/seo_stamp.py
  Check only (changes nothing):  python tools/seo_stamp.py --check
"""
import argparse, html, json, os, re, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OG_W, OG_H = 1200, 630

def esc(t):
    return html.escape(t, quote=True)

def page_url(site, route):
    return site.rstrip('/') + '/' + (route + '/' if route else '')

def meta_block(page, site, name, noindex=False):
    """The exact set of tags every public page carries. Returns the HTML text."""
    url = page_url(site, page['route'])
    img = site.rstrip('/') + '/' + page['image'].lstrip('/')
    alt = page.get('imageAlt') or page['title']
    ptype = page.get('type', 'website')
    L = ['<title>%s</title>' % esc(page['title']),
         '<meta name="description" content="%s">' % esc(page['description']),
         '<meta name="robots" content="%s">' % ('noindex, follow' if noindex else 'index, follow')]
    if not noindex:
        L.append('<link rel="canonical" href="%s">' % url)
    L += ['<meta property="og:type" content="%s">' % ptype,
          '<meta property="og:url" content="%s">' % url,
          '<meta property="og:title" content="%s">' % esc(page['title']),
          '<meta property="og:description" content="%s">' % esc(page['description']),
          '<meta property="og:image" content="%s">' % img,
          '<meta property="og:image:width" content="%d">' % OG_W,
          '<meta property="og:image:height" content="%d">' % OG_H,
          '<meta property="og:image:type" content="image/jpeg">',
          '<meta property="og:image:alt" content="%s">' % esc(alt),
          '<meta property="og:site_name" content="%s">' % esc(name),
          '<meta property="og:locale" content="en_US">',
          '<meta name="twitter:card" content="summary_large_image">',
          '<meta name="twitter:title" content="%s">' % esc(page['title']),
          '<meta name="twitter:description" content="%s">' % esc(page['description']),
          '<meta name="twitter:image" content="%s">' % img,
          '<meta name="twitter:image:alt" content="%s">' % esc(alt)]
    return '\n'.join(L) + '\n'

STRIP = [r'<title>.*?</title>\s*',
         r'<meta\s+name="description"[^>]*>\s*', r'<meta\s+name="robots"[^>]*>\s*', r'<link\s+rel="canonical"[^>]*>\s*',
         r'<meta\s+property="(?:og|article):[^"]*"[^>]*>\s*', r'<meta\s+name="twitter:[^"]*"[^>]*>\s*']

def stamp_head(doc, page, site, name, noindex=False):
    """Remove every old SEO/social tag in <head> and insert the standard block (once, before the icons)."""
    end = doc.index('</head>')
    head, rest = doc[:end], doc[end:]
    for pat in STRIP:
        head = re.sub(pat, '', head, flags=re.S)
    block = meta_block(page, site, name, noindex)
    m = re.search(r'<link\s+rel="icon"', head)
    head = head[:m.start()] + block + head[m.start():] if m else head + block
    return head + rest

def minimal_jsonld(page, site, cfg):
    """Basic structured data for a hand-made page (only used when the page has none yet)."""
    url = page_url(site, page['route']); org = site.rstrip('/') + '/#organization'
    graph = [{'@type': ['ProfessionalService', 'Organization'], '@id': org, 'name': cfg['legalName'], 'url': site.rstrip('/') + '/',
              'email': cfg['email'], 'logo': {'@type': 'ImageObject', 'url': site.rstrip('/') + '/' + cfg['logo'], 'width': 512, 'height': 512},
              'address': [dict({'@type': 'PostalAddress'}, **a) for a in cfg['addresses']]},
             {'@type': 'WebSite', '@id': site.rstrip('/') + '/#website', 'url': site.rstrip('/') + '/', 'name': cfg['name'], 'publisher': {'@id': org}},
             {'@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': page['title'], 'description': page['description'],
              'isPartOf': {'@id': site.rstrip('/') + '/#website'}, 'about': {'@id': org},
              'primaryImageOfPage': {'@type': 'ImageObject', 'url': site.rstrip('/') + '/' + page['image'], 'width': OG_W, 'height': OG_H}}]
    if cfg.get('sameAs'): graph[0]['sameAs'] = cfg['sameAs']
    if page['route']:
        graph.append({'@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
            {'@type': 'ListItem', 'position': 1, 'name': 'Home', 'item': site.rstrip('/') + '/'},
            {'@type': 'ListItem', 'position': 2, 'name': page['title'].split(' | ')[0], 'item': url}]})
        graph[2]['breadcrumb'] = {'@id': url + '#breadcrumb'}
    return '<script type="application/ld+json" id="page-ld">%s</script>\n' % json.dumps({'@context': 'https://schema.org', '@graph': graph}, ensure_ascii=False)

def sitemap(pages, site, lastmod):
    out = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
    for p in pages:
        out += ['  <url>', '    <loc>%s</loc>' % page_url(site, p['route']), '    <lastmod>%s</lastmod>' % lastmod, '  </url>']
    return '\n'.join(out + ['</urlset>', ''])

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--root', default=os.path.dirname(HERE)); ap.add_argument('--check', action='store_true')
    ap.add_argument('--lastmod', default=None)
    a = ap.parse_args()
    cfg = json.load(open(os.path.join(HERE, 'pages.json'), encoding='utf-8'))
    site, name, pages = cfg['site']['url'], cfg['site']['name'], cfg['pages']
    problems = []
    for p in pages:
        f = os.path.join(a.root, p['route'], 'index.html') if p['route'] else os.path.join(a.root, 'index.html')
        if not os.path.exists(f): problems.append('missing page file: ' + f); continue
        if not os.path.exists(os.path.join(a.root, p['image'])): problems.append('missing social image: ' + p['image'])
        doc = open(f, encoding='utf-8').read()
        new = stamp_head(doc, p, site, name)
        if 'id="page-ld"' not in new:
            new = new.replace('</head>', minimal_jsonld(p, site, cfg['site']) + '</head>', 1)
        if new != doc:
            if a.check: problems.append('tags out of date: ' + f)
            else: open(f, 'w', encoding='utf-8').write(new); print('updated', f)
    if not a.check:
        lm = a.lastmod or __import__('datetime').date.today().isoformat()
        open(os.path.join(a.root, 'sitemap.xml'), 'w', encoding='utf-8').write(sitemap(pages, site, lm)); print('sitemap.xml rebuilt with', len(pages), 'pages')
    for x in problems: print('PROBLEM:', x)
    return 1 if problems else 0

if __name__ == '__main__':
    sys.exit(main())
