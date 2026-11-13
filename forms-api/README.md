# Pacific Marketing Solution — Forms API (Node.js)

A Node.js replacement for the old PHP contact/newsletter backend (`api/contact.php`,
`api/newsletter.php` at the repo root), deployed as Vercel serverless functions. Same
behavior: spam traps, rate limiting, field validation, and sending the email over the
same Hostinger SMTP mailbox — just running on Node instead of PHP.

The main site keeps deploying to Hostinger exactly as before. Only this small API moves
to a host that can run Node (Hostinger shared hosting can't). Nothing about the rest of
the site changes.

## What you need to do (steps only you can do — they need your own accounts/secrets)

### 1. Create a free Vercel account and deploy this folder
1. Go to https://vercel.com and sign up (free "Hobby" plan is enough).
2. "Add New..." -> "Project" -> import the `pacific-marketing-solution` GitHub repo.
3. When it asks for the **Root Directory**, set it to `forms-api` (this folder) — not the
   repo root, since the Next.js site is a separate deployment on Hostinger.
4. Framework preset: "Other" (no build step needed).
5. Deploy. Vercel gives you a URL like `https://pms-forms-api.vercel.app`.

### 2. Set the environment variables
In the Vercel project: **Settings -> Environment Variables**, add each one from
`.env.example` in this folder:

| Variable | Value |
|---|---|
| `SMTP_HOST` | `smtp.hostinger.com` |
| `SMTP_PORT` | `465` |
| `SMTP_USERNAME` | `info@pacificmarketingsolution.com` |
| `SMTP_PASSWORD` | the real mailbox password (the same one used in the old `pms-secrets.php` on Hostinger) |
| `ALLOWED_ORIGIN` | `https://pacificmarketingsolution.com` |

Redeploy after adding them (Vercel prompts you to).

### 3. (Recommended) Set up Upstash Redis for rate limiting
Without this, the API still works — it just skips rate limiting (fails open), so someone
could send more messages than intended.

1. Go to https://console.upstash.com, sign up free, create a Redis database (any nearby
   region).
2. Copy its **REST URL** and **REST Token** from the database page.
3. Add them to the Vercel project as `UPSTASH_REDIS_REST_URL` and
   `UPSTASH_REDIS_REST_TOKEN`, then redeploy.

### 4. Point the website at the new API
Once deployed, tell me the Vercel URL it gave you (e.g.
`https://pms-forms-api.vercel.app`) and I'll update the two React form components
(`SiteForm.tsx`, `LeadPlanForm.tsx`) to call it instead of the old `/api/*.php` paths,
rebuild, and sync the deploy output — the same way we've been shipping other changes.

### 5. Once the new API is confirmed working
The old `api/` folder (PHP) at the repo root can be removed, and the SMTP password can
be taken out of Hostinger's `pms-secrets.php` if you want to fully retire PHP there.
Not urgent — do this only after you've tested a real submission through the new API and
confirmed the email arrives.

## Local testing (optional)

```bash
cd forms-api
npm install
npx vercel dev
```

This runs the functions locally at `http://localhost:3000/api/contact` and
`http://localhost:3000/api/newsletter`. You'll need a `.env` file (copy `.env.example`
and fill in real values) for SMTP sending to actually work locally.
