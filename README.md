# Pacific Marketing Solution LLC - website

A static website: no build step, no framework. Everything is in `index.html`.

## Files

| File or folder | What it is |
|---|---|
| `index.html` | The whole website (home page). |
| `about/`, `work/`, `contact/`, `insights/`, `privacy/`, `terms/`, `services/...` | One folder per page. Each holds a copy of `index.html` so a direct address such as `/about` opens with a normal 200 response (good for search engines). |
| `404.html` | A copy of the site, used for any other address. |
| `.nojekyll` | Tells GitHub Pages to publish the files exactly as they are. |
| `robots.txt` | Lets search engines crawl the site. |
| `backend/google-apps-script-forms.gs` | The form backend. It does NOT run on GitHub. You paste it into script.google.com (steps are inside the file). |

When you change `index.html`, copy the new file over every `index.html` in the page folders and over `404.html`
(they are all identical).

## Publish on GitHub Pages

1. Create a repository on GitHub (it must be public on a free account).
2. Upload everything in this folder (drag the files and folders into the repository page, or use git).
3. Repository **Settings** -> **Pages** -> **Build and deployment** -> **Source: Deploy from a branch** -> branch **main**, folder **/ (root)** -> **Save**.
4. After a minute the site is live at:
   - `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/` for a normal repository, or
   - `https://YOUR-USERNAME.github.io/` if the repository is named exactly `YOUR-USERNAME.github.io`.

The page works at either address; it works out the folder by itself.

## Use your own domain

1. Repository **Settings** -> **Pages** -> **Custom domain** -> enter your domain -> **Save**
   (GitHub creates a file called `CNAME` in the repository; keep it).
2. At your domain provider, add the DNS records GitHub shows you (A records for the bare domain, a CNAME for `www`).
3. Tick **Enforce HTTPS** when GitHub allows it.

## Settings to fill in (near the top of `index.html`)

- `FORM_ENDPOINT`: the web-app URL of `backend/google-apps-script-forms.gs`. Until it is set the two forms cannot send email.
- `GOOGLE_MAPS_API_KEY`: a browser key for the Maps JavaScript API and Geocoding API, restricted to your website
  addresses in Google Cloud Console. Until it is set, the offices are shown as cards without the interactive map.
- `TCAR_SPEED`: how fast the testimonials float (pixels per second).

Both values above are safe to publish in a public repository only because they are public-by-design:
the form URL carries no password, and the Maps key is locked to your domain.
Never commit passwords, SMTP details, private API keys or tokens.

## Search engine files (already included)

| File | What it does |
|---|---|
| `sitemap.xml` | Lists every page address for Google, Bing and AI search tools. |
| `robots.txt` | Tells crawlers they may read the whole site and where the sitemap is. |
| `llms.txt` | A short plain summary of the business and its main pages for AI assistants. |
| `og-image.png` | The picture shown when a page link is shared on social media or chat apps. |

Each page folder (for example `about/`) already contains that page's own title, description, canonical link,
structured data and readable text, so search engines and AI tools can read it without running JavaScript.

After the site is live: submit `https://www.pacificmarketingsolution.com/sitemap.xml` in Google Search Console
and Bing Webmaster Tools. If your real domain is different, replace `https://www.pacificmarketingsolution.com`
in `sitemap.xml`, `robots.txt`, `llms.txt` and the `SITE_URL` setting inside `index.html`, then rebuild the page copies.

## Search Console checklist

1. Put the files online and connect your domain (GitHub Pages: Settings, Pages, Custom domain). Turn on "Enforce HTTPS".
2. Make sure `https://www.pacificmarketingsolution.com/` opens the site, and that the version without "www" sends visitors to it.
3. In Google Search Console, add the property:
   - "Domain" property: verify with a DNS TXT record at your domain provider (best option, covers www and non-www), or
   - "URL prefix" property for `https://www.pacificmarketingsolution.com/`: verify with the HTML tag
     (send the tag to the person building the site, who adds it to every page), or upload the verification
     file Google gives you to the main folder of this repository.
4. Sitemaps: submit `sitemap.xml`. Status should say "Success" and show 23 discovered pages.
5. URL Inspection: paste the home page address, click "Test live URL", then "Request indexing". Repeat for the
   Services, About, Work and Contact pages.
6. Repeat steps 3 and 4 in Bing Webmaster Tools (you can import the site from Search Console).
7. Check Search Console after a few days: Pages (indexing), Enhancements (FAQ, breadcrumbs), Core Web Vitals.

## Google Analytics (Google tag G-Q9CBL5LJ90)

The Google tag is already pasted straight after `<head>` on every page, including `404.html`. Do not add it a second time.
In Google Analytics, keep "Enhanced measurement" switched on (including "Page changes based on browser history events"),
because the site moves between pages without reloading in some cases. Visitors in the European Economic Area may
need a cookie notice or Google consent mode, depending on your legal advice.

## Logo and icons

The PMS logo is shown in the header and footer (`img/logo-mark.webp`, 108 px, about 1.4 KB) and is the source of every icon:
`favicon.ico` (16, 32 and 48 px), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png` (180 px),
`android-chrome-192x192.png`, `android-chrome-512x512.png` and `logo-512.png` (used in the business structured data).
`site.webmanifest` lists the app icons. To change the logo later, replace these files with the same names and sizes.
