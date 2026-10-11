#!/usr/bin/env python3
"""SEO / international-SEO validation for the static site folder.  Run:  python3 tools/seo-validate.py [site-folder]
Checks: canonical (self), hreflang (reciprocal, existing pages only, x-default), sitemap vs files, JSON-LD validity, lang/dir, titles, descriptions,
internal links, robots, noindex, English leakage in localized pages."""
import sys,os,re,json,glob,html
from urllib.parse import urlparse
ROOT=os.path.abspath(sys.argv[1]) if len(sys.argv)>1 else os.path.abspath(os.path.join(os.path.dirname(__file__),'..'))
SITE='https://pacificmarketingsolution.com'
PFX={'fr':'fr','de':'de','ar':'ar','zh-CN':'zh','ja':'ja','es-MX':'es-mx','es-ES':'es-es','pt-PT':'pt-pt'}
files={}
for f in glob.glob(ROOT+'/**/index.html',recursive=True)+[ROOT+'/index.html']:
    rel=os.path.relpath(os.path.dirname(f),ROOT).replace('\\','/')
    if rel.startswith(('tools','api','locales','images','fonts')) : continue
    url=SITE+'/'+('' if rel=='.' else rel+'/');files[url]=f
pages={}
for url,f in files.items():
    h=open(f,encoding='utf-8').read();g=lambda p:(re.search(p,h,re.S) or [None,None])[1]
    pages[url]={'file':f,'html':h,'lang':g(r'<html lang="([^"]+)"'),'dir':g(r'<html[^>]*\sdir="([^"]+)"'),'title':html.unescape(g(r'<title>(.*?)</title>') or ''),'desc':html.unescape(g(r'<meta name="description" content="([^"]*)"') or ''),'canon':g(r'<link rel="canonical" href="([^"]+)"'),'robots':g(r'<meta name="robots" content="([^"]*)"') or '',
     'alts':dict(re.findall(r'<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"',h)),'og':dict(re.findall(r'<meta property="og:([a-z:]+)" content="([^"]*)"',h)),'ld':re.findall(r'<script type="application/ld\+json"[^>]*>(.*?)</script>',h,re.S)}
issues=[];ok=0;NOTES=[]
def bad(url,msg): issues.append((url,msg))
for url,p in pages.items():
    want_lang='en'
    seg=urlparse(url).path.strip('/').split('/')[0]
    for L,pf in PFX.items():
        if seg==pf: want_lang=L
    if p['lang']!=want_lang: bad(url,f"html lang is {p['lang']}, expected {want_lang}")
    if want_lang=='ar' and p['dir']!='rtl': bad(url,'Arabic page without dir=rtl')
    if want_lang!='ar' and p['dir']=='rtl': bad(url,'dir=rtl on a left-to-right page')
    if p['canon']!=url: bad(url,f"canonical is {p['canon']}, expected itself")
    if 'noindex' in p['robots']: bad(url,'noindex')
    if not p['title'] or len(p['title'])>70: bad(url,f"title length {len(p['title'])}")
    if not p['desc'] or len(p['desc'])>200: bad(url,f"description length {len(p['desc'])}")
    if p['og'].get('url')!=url: bad(url,'og:url differs from the canonical')
    if p['og'].get('locale')!={'en':'en_US','fr':'fr_FR','de':'de_DE','ar':'ar_AR','zh-CN':'zh_CN','ja':'ja_JP','es-MX':'es_MX','es-ES':'es_ES','pt-PT':'pt_PT'}[want_lang]: bad(url,f"og:locale {p['og'].get('locale')}")
    for b in p['ld']:
        try: json.loads(b)
        except Exception as e: bad(url,'JSON-LD does not parse: '+str(e)[:60])
    # hreflang
    if p['alts']:
        if 'x-default' not in p['alts']: bad(url,'no x-default')
        if p['alts'].get(want_lang)!=url: bad(url,'hreflang does not reference the page itself')
        for l,u in p['alts'].items():
            if u not in pages: bad(url,f'hreflang {l} points to a page that does not exist: {u}')
            elif l!='x-default' and pages[u]['alts'].get(want_lang)!=url: bad(url,f'hreflang {l} is not reciprocal ({u})')
        if p['alts'].get('x-default')!=p['alts'].get('en'): bad(url,'x-default is not the English address')
    ok+=1
# duplicates
from collections import Counter
for k,name in (('title','title'),('desc','description')):
    c=Counter(p[k] for p in pages.values())
    for v,n in c.items():
        if n>1 and v:
            owners=[u for u,p in pages.items() if p[k]==v]
            if n==2 and any('/es-mx/' in u for u in owners) and any('/es-es/' in u for u in owners): NOTES.append(f'es-MX and es-ES share the same {name}: {v[:50]}')
            else: bad('(several)',f'duplicate {name} on {n} pages: {v[:60]}')
# sitemap
sm=open(ROOT+'/sitemap.xml',encoding='utf-8').read();locs=re.findall(r'<loc>([^<]+)</loc>',sm)
for u in locs:
    if u not in pages: bad(u,'in the sitemap but no such page')
for u,p in pages.items():
    if u not in locs and 'noindex' not in p['robots']: bad(u,'indexable page missing from the sitemap')
if len(locs)!=len(set(locs)): bad('sitemap','duplicate entries')
# internal links resolve
for url,p in pages.items():
    for h in set(re.findall(r'href="(/[^"#?]*)"',re.sub(r'<script.*?</script>','',p['html'],flags=re.S))):
        path=h
        if path.startswith(('/images/','/fonts/','/locales/','/api/')) or re.search(r'\.(png|jpg|jpeg|webp|ico|svg|txt|xml|json|webmanifest|woff2|css|js)$',path): continue
        full=SITE+path if path.endswith('/') else SITE+path+'/'
        if full not in pages and not os.path.exists(ROOT+path+'index.html'): bad(url,f'internal link to a missing page: {h}')
# language consistency: a localized page must not link to the English version of a page that has its own translation
for url,p in pages.items():
    seg=urlparse(url).path.strip('/').split('/')[0]
    if seg in PFX.values():
        for h in set(re.findall(r'<a [^>]*href="(/[^"#?]*)"[^>]*data-route="([^"]*)"',re.sub(r'<script.*?</script>','',p['html'],flags=re.S))):
            href,route=h
            alt=SITE+'/'+seg+'/'+(route+'/' if route else '')
            if alt in pages and not href.startswith('/'+seg+'/') : bad(url,f'link to English {href} although {alt} exists')
# robots
rb=open(ROOT+'/robots.txt').read()
if re.search(r'Disallow:\s*/(fr|de|ar|zh|ja|es-mx|es-es|pt-pt|en)?/?\s*$',rb,re.M) and 'Disallow: /\n' in rb: bad('robots.txt','blocks the whole site')
if SITE+'/sitemap.xml' not in rb: bad('robots.txt','no sitemap line')
print(f'pages checked: {len(pages)} | sitemap addresses: {len(locs)} | JSON-LD blocks: {sum(len(p["ld"]) for p in pages.values())}')
for u,m in issues[:60]: print('  ISSUE',u.replace(SITE,''),'|',m)
print('information:',len(NOTES),'page pairs where es-MX and es-ES use identical wording (allowed, hreflang separates them)')
print('TOTAL ISSUES:',len(issues))
sys.exit(1 if issues else 0)
