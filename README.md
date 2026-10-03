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
