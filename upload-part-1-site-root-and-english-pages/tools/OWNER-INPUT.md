# OWNER CHECKLIST: what we need from you

Nothing below has been invented or published. Every item stays unpublished until you provide it. Tick each line as you go.

## A. Business details  (file: `tools/owner-info.json`)
- [ ] **Official social profile URLs**: full https addresses of profiles you control (LinkedIn, Facebook, Instagram, X, YouTube, TikTok). Goes into `sameAs` in the Organization data.
- [ ] **Public phone number**: with country code, only if you want it public.
- [ ] **Opening hours**: per office, days and times, local time.
- [ ] **Primary office**: Houston or Lahore (listed first in the structured data).
- [ ] **Service areas**: the countries or regions where you really serve clients.
- [ ] **Article authors**: the real author's full name for each of the 7 articles.
- [ ] **Article publication dates**: `YYYY-MM-DD` for each article.
- [ ] **Article update dates**: `YYYY-MM-DD` for each article that was updated after publishing.
- [ ] **AI training crawler preference**: `"allow"` (default, nothing changes) or `"block"` (asks OpenAI, Anthropic, Google-Extended, Apple-Extended and Common Crawl training crawlers not to use the site; normal search and AI answer crawlers stay allowed).

After filling the file, run `python3 tools/apply-owner-info.py` from the site folder (add `--check` to only validate) and upload every file it reports as changed.

## B. Answers for each of the 8 services  (file: `tools/owner-service-answers.json`)
For EACH service write five real answers. Keep them factual: no guarantees, no invented numbers, no results you have not seen in real projects. A range plus the factors that change it is better than a single figure.

| # | Service | 1 Typical timeline | 2 Pricing model or factors | 3 Realistic outcomes | 4 Important limitations | 5 Key deliverables |
|---|---|---|---|---|---|---|
| 1 | AI automation and CRM | [ ] | [ ] | [ ] | [ ] | [ ] |
| 2 | AI chatbots and voice agents | [ ] | [ ] | [ ] | [ ] | [ ] |
| 3 | Performance marketing and funnels | [ ] | [ ] | [ ] | [ ] | [ ] |
| 4 | Content, creative and video | [ ] | [ ] | [ ] | [ ] | [ ] |
| 5 | Social media management | [ ] | [ ] | [ ] | [ ] | [ ] |
| 6 | Websites and apps | [ ] | [ ] | [ ] | [ ] | [ ] |
| 7 | SEO, AEO and GEO | [ ] | [ ] | [ ] | [ ] | [ ] |
| 8 | White-label services | [ ] | [ ] | [ ] | [ ] | [ ] |

### Social Media Management scope (the page was drafted by us)
- [ ] Platforms you manage (we listed Facebook, Instagram, LinkedIn, TikTok)
- [ ] Do you reply to comments and messages?
- [ ] Is paid social advertising part of this service?
- [ ] Is a monthly report included?
- [ ] Posting frequency options you offer
(file: `tools/owner-service-answers.json`, section `socialMediaManagementScopeConfirmation`)

## C. How your answers will appear on the page
Each answer becomes a short answer-first block, in the same structure as the existing FAQ:
1. **Question**: for example "How long does a typical project take?"
2. **Direct answer**: one or two sentences with the real range.
3. **Supporting explanation**: what changes the timeline or price.
4. **Relevant details**: deliverables, limitations, what we need from the client.
When the file is filled in, send it back; the answers are added to each service page and its FAQ data, then translated into the other 8 languages and re-checked.

## D. Other things only you can confirm
- [ ] Client names and results you are allowed to publish.
- [ ] Anything on the site that is out of date.
