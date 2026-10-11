#!/usr/bin/env python3
"""Publishes the real business details you entered in tools/owner-info.json.
Run from the site folder:   python3 tools/apply-owner-info.py        (add --check to only validate)
It writes assets/owner-info.js (read by the site's structured data), updates the Organization data inside every page, and the entity summary in llms.txt.
Empty fields are never published. Run it again any time you change the file; upload every file it reports as changed."""
import json,os,re,sys,glob
ROOT=os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)),'..'))
SRC=os.path.join(ROOT,'tools','owner-info.json');CHECK='--check' in sys.argv
d=json.load(open(SRC,encoding='utf-8'))
errs=[]
soc=[u.strip() for u in d.get('socialProfiles') or [] if str(u).strip()]
for u in soc:
    if not re.match(r'^https://[^\s]+\.[^\s]+$',u): errs.append('socialProfiles: not a full https address: '+u)
ph=(d.get('publicPhone') or '').strip() or None
if ph and not re.match(r'^\+?[0-9][0-9 ()\-.]{6,20}$',ph): errs.append('publicPhone looks wrong: '+ph)
DAYS={'Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'}
hours=[]
for h in d.get('officeHours') or []:
    if not isinstance(h,dict): errs.append('officeHours entries must be objects');continue
    days=h.get('days') or [];ok=bool(days) and all(x in DAYS for x in days) and re.match(r'^\d\d:\d\d$',str(h.get('opens'))) and re.match(r'^\d\d:\d\d$',str(h.get('closes')))
    if not ok: errs.append('officeHours entry needs days (English names), opens and closes as HH:MM: '+json.dumps(h))
    else: hours.append({'days':days,'opens':h['opens'],'closes':h['closes'],'office':h.get('office')})
prim=(d.get('primaryOffice') or '').strip() or None
areas=[a.strip() for a in d.get('serviceAreas') or [] if str(a).strip()]
if prim and prim.lower() not in ('houston','lahore'): errs.append('primaryOffice must be "Houston" or "Lahore"')
arts={}
for slug,a in (d.get('articles') or {}).items():
    if not isinstance(a,dict): continue
    e={}
    au=(a.get('author') or '').strip() if isinstance(a.get('author'),str) else None
    if au: e['author']=au
    for k in ('datePublished','dateModified'):
        v=a.get(k)
        if v:
            if re.match(r'^\d{4}-\d\d-\d\d$',str(v)): e[k]=str(v)
            else: errs.append('articles.%s.%s must be YYYY-MM-DD: %s'%(slug,k,v))
    if e: arts[slug]=e
crawl=d.get('aiTrainingCrawlers')
if crawl not in (None,'allow','block'): errs.append('aiTrainingCrawlers must be null, "allow" or "block"')
if errs:
    print('NOT APPLIED. Please fix:');[print('  -',e) for e in errs];sys.exit(1)
owner={'sameAs':soc,'telephone':ph,'areaServed':areas,'openingHours':hours,'primaryOffice':prim,'articles':arts}
print('Real values found: social profiles %d | phone %s | opening-hour rows %d | primary office %s | service areas %d | articles with details %d | AI training crawlers: %s'%(len(soc),'yes' if ph else 'no',len(hours),prim or 'no',len(areas),len(arts),crawl or 'unchanged'))
if CHECK: sys.exit(0)
open(os.path.join(ROOT,'assets','owner-info.js'),'w',encoding='utf-8').write('window.PMS_OWNER='+json.dumps(owner,ensure_ascii=False)+';\n')
def patch(o):
    for k in ('sameAs','telephone','areaServed','openingHoursSpecification'): o.pop(k,None)
    if soc: o['sameAs']=soc
    if ph:
        o['telephone']=ph
        if isinstance(o.get('contactPoint'),dict): o['contactPoint']['telephone']=ph
    elif isinstance(o.get('contactPoint'),dict): o['contactPoint'].pop('telephone',None)
    if areas: o['areaServed']=[{'@type':'Place','name':a} for a in areas]
    if hours: o['openingHoursSpecification']=[{'@type':'OpeningHoursSpecification','dayOfWeek':h['days'],'opens':h['opens'],'closes':h['closes']} for h in hours]
    if prim:
        for key in ('address','location'):
            lst=o.get(key)
            if isinstance(lst,list):
                lst.sort(key=lambda x:0 if prim.lower() in json.dumps(x).lower() else 1)
    return o
changed=0
for f in glob.glob(ROOT+'/**/*.html',recursive=True):
    if '/tools/' in f: continue
    h=open(f,encoding='utf-8').read();orig=h
    def fix(m):
        try: j=json.loads(m.group(2))
        except Exception: return m.group(0)
        before=json.dumps(j,sort_keys=True)
        graph=j.get('@graph') if isinstance(j,dict) else None
        nodes=graph if graph else [j]
        hit=False
        for n in nodes:
            if isinstance(n,dict) and n.get('legalName'): patch(n);hit=True
            if isinstance(n,dict) and n.get('@type')=='Article':
                mm=re.search(r'/insights/([^/#]+)/',str(n.get('@id','')))
                a=arts.get(mm.group(1)) if mm else None
                for k in ('datePublished','dateModified'): n.pop(k,None)
                if mm: n['author']={'@id':'%s/#organization'%'https://pacificmarketingsolution.com'}
                if a:
                    if a.get('author'): n['author']={'@type':'Person','name':a['author']}
                    for k in ('datePublished','dateModified'):
                        if a.get(k): n[k]=a[k]
                hit=True
        return m.group(1)+json.dumps(j,ensure_ascii=False)+m.group(3) if (hit and json.dumps(j,sort_keys=True)!=before) else m.group(0)
    h=re.sub(r'(<script type="application/ld\+json"[^>]*>)(.*?)(</script>)',fix,h,flags=re.S)
    if h!=orig: open(f,'w',encoding='utf-8').write(h);changed+=1
ll=os.path.join(ROOT,'llms.txt');t=open(ll,encoding='utf-8').read()
t=re.sub(r'\n- (Phone|Opening hours|Service areas|Official profiles|Primary office): [^\n]*','',t)
add=''
if prim: add+='\n- Primary office: '+prim
if ph: add+='\n- Phone: '+ph
if hours: add+='\n- Opening hours: '+'; '.join('%s %s-%s%s'%(','.join(x[:3] for x in h['days']),h['opens'],h['closes'],(' ('+h['office']+')') if h.get('office') else '') for h in hours)
if areas: add+='\n- Service areas: '+', '.join(areas)
if soc: add+='\n- Official profiles: '+', '.join(soc)
if add: t=t.replace('\n- Contact: info@pacificmarketingsolution.com','\n- Contact: info@pacificmarketingsolution.com'+add,1)
open(ll,'w',encoding='utf-8').write(t)
rb=os.path.join(ROOT,'robots.txt');r=open(rb,encoding='utf-8').read()
r=re.sub(r'\n?# BEGIN ai-training-opt-out.*?# END ai-training-opt-out\n','\n',r,flags=re.S)
if crawl=='block':
    blk='# BEGIN ai-training-opt-out\n'+''.join('User-agent: %s\nDisallow: /\n\n'%b for b in ('GPTBot','ClaudeBot','Google-Extended','Applebot-Extended','CCBot'))+'# END ai-training-opt-out\n'
    r=r.replace('Sitemap:',blk+'\nSitemap:',1)
open(rb,'w',encoding='utf-8').write(r)
print('Updated structured data in %d pages, assets/owner-info.js and llms.txt. Upload these changed files.'%changed)
