#!/usr/bin/env python3
"""Translation completeness check. Compares every language with the English source files in locales/en/ and reports missing keys, per page.
Run from the site folder:  python3 tools/i18n-validate.py   (exit code 1 if any key is missing)"""
import json,os,sys,glob
ROOT=os.path.join(os.path.dirname(os.path.abspath(__file__)),'..') if '__file__' in globals() else '.'
LOC=os.path.join(ROOT,'locales')
LANGS=['fr','de','ar','zh-CN','ja','es-MX','es-ES','pt-PT']
PROPER_OK=lambda k:(len(k.split())<=3 and k.replace(' ','').replace('-','').replace('.','').isalnum() and k[:1].isupper()) or not any(c.isalpha() for c in k)
en={os.path.basename(f)[:-5]:json.load(open(f,encoding='utf-8'))['map'] for f in glob.glob(LOC+'/en/*.json')}
words={n:sum(len(k.split()) for k in m) for n,m in en.items()}
print(f"{'page':<52}{'keys':>6}"+''.join(f'{l:>8}' for l in LANGS))
tot_missing={l:0 for l in LANGS};tot_words_missing={l:0 for l in LANGS};report={}
for n in sorted(en):
    row=f'{n:<52}{len(en[n]):>6}'
    for l in LANGS:
        p=os.path.join(LOC,l,n+'.json');have=json.load(open(p,encoding='utf-8'))['map'] if os.path.exists(p) else {}
        miss=[k for k in en[n] if k not in have and not PROPER_OK(k)]
        tot_missing[l]+=len(miss);tot_words_missing[l]+=sum(len(k.split()) for k in miss);report.setdefault(n,{})[l]=len(miss)
        row+=f'{("OK" if not miss else "-"+str(len(miss))):>8}'
    print(row)
print('\nmissing keys per language (names and numbers excluded):',tot_missing)
print('missing words per language:',tot_words_missing)
json.dump(report,open(os.path.join(ROOT,'locales','_missing.json'),'w'),indent=1)
sys.exit(1 if any(tot_missing.values()) else 0)
