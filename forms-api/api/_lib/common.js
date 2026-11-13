/**
 * Pacific Marketing Solution: shared code for the website forms (Node.js port of the
 * original PHP backend at api/_lib/common.php). Deployed as Vercel serverless functions,
 * which are stateless — every secret comes from environment variables (set in the Vercel
 * dashboard, never committed), and rate-limit counters live in Upstash Redis instead of
 * local files, since a serverless instance has no durable local disk.
 */

const nodemailer = require("nodemailer");
const { Redis } = require("@upstash/redis");

const PMS_MAIL_ADDRESS = "info@pacificmarketingsolution.com";
const PMS_MAIL_NAME = "Pacific Marketing Solution";
const PMS_MAIL_COPY = "muhammadkhan669@gmail.com"; // every form email is also sent here (owner's request)

let redis = null;
function getRedis() {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null; // rate limiting fails open if not configured (see pmsLimit)
  redis = new Redis({ url, token });
  return redis;
}

/** Send the JSON answer and stop the function. Only {"ok":true} or {"ok":false,"message":"..."} ever leave this. */
function respond(res, ok, status = 200) {
  res.status(status);
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Robots-Tag", "noindex");
  res.end(ok ? '{"ok":true}' : '{"ok":false,"message":"Unable to send your message."}');
}

/** CORS: only the site's own origin (ALLOWED_ORIGIN env var, comma-separated for more than one) may call this. */
function applyCors(req, res) {
  const allowed = (process.env.ALLOWED_ORIGIN || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const origin = req.headers.origin || "";
  const ok = allowed.length > 0 && allowed.includes(origin);
  if (ok) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
  }
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  return ok;
}

/** A single line of text: control characters (including line breaks) become spaces, then it is shortened. */
function pmsLine(v, max) {
  let s = typeof v === "string" ? v : "";
  s = s.replace(/[\x00-\x1F\x7F\u2028\u2029]+/gu, " ");
  s = s.replace(/\s{2,}/gu, " ").trim();
  return Array.from(s).slice(0, max).join("");
}

/** Longer text with line breaks kept as plain newlines. */
function pmsText(v, max) {
  let s = typeof v === "string" ? v : "";
  s = s.replace(/\r\n|\r/g, "\n");
  s = s.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
  s = s.replace(/\n{3,}/g, "\n\n").trim();
  return Array.from(s).slice(0, max).join("");
}

const EMAIL_RE = /^[^\s,;<>"\\]+@[^\s,;<>"\\]+\.[^\s,;<>"\\]{2,}$/u;
function pmsValidEmail(e) {
  return typeof e === "string" && e !== "" && e.length <= 254 && !/[\s,;<>"\\]/.test(e) && EMAIL_RE.test(e);
}

/** Spam protection: true means "a bot sent this" (the message is quietly dropped, the bot still sees success). */
function pmsIsBot(input) {
  if (pmsLine(input.website ?? "", 200) !== "") return true; // hidden trap field was filled in
  const el = input.el;
  const isNumeric = typeof el === "number" || (typeof el === "string" && /^\d+$/.test(el));
  if (!isNumeric) return true; // posted without the website's own script (scripts, bots)
  if (Number(el) < 3000) return true; // filled in faster than a person can (under 3 seconds)
  return false;
}

function pmsLinkCount(s) {
  const m = s.match(/(https?:\/\/|www\.|\[url|<a\s|href=)/gi);
  return m ? m.length : 0;
}

/** Obvious junk: links in a name/company, HTML/BBCode links, many links, or classic spam words. */
function pmsIsJunk(name, company, message) {
  if (pmsLinkCount(name) > 0 || pmsLinkCount(company) > 0) return true;
  if (/(\[url|<a\s|href=)/i.test(message)) return true;
  if (pmsLinkCount(message) > 3) return true;
  if (
    /\b(viagra|cialis|casino|porn|xxx|escort|payday loan|forex signals?|crypto (?:investment|giveaway)|bitcoin (?:investment|doubler))\b/i.test(
      `${name} ${company} ${message}`
    )
  )
    return true;
  return false;
}

/** Looks like a sales pitch or link spam, but might be real: still delivered, with "[Possible spam]" in the subject. */
function pmsMaybeSpam(message) {
  if (pmsLinkCount(message) >= 2) return true;
  return /\b(backlinks?|guest post(?:ing)?|link building|rank (?:your|you on) (?:the )?first page|seo (?:package|proposal) for your|we (?:noticed|found) (?:some )?(?:errors|issues) on your (?:web)?site|increase your (?:website )?traffic|outsourc(?:e|ing) (?:your|our)|lead list|email list for sale|unsubscribe)\b/i.test(
    message
  );
}

/** Read and validate the raw request: POST only, allowed origin only, small JSON body. Returns the parsed body or null (and has already responded) on failure. */
async function pmsRequest(req, res) {
  if (req.method === "OPTIONS") {
    applyCors(req, res);
    res.status(204).end();
    return null;
  }
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST, OPTIONS");
    respond(res, false, 405);
    return null;
  }
  if (!applyCors(req, res)) {
    respond(res, false, 403);
    return null;
  }
  const len = Number(req.headers["content-length"] || 0);
  if (len > 20000) {
    respond(res, false, 413);
    return null;
  }
  let data = req.body;
  if (typeof data === "string") {
    try {
      data = JSON.parse(data);
    } catch {
      data = null;
    }
  }
  if (!data || typeof data !== "object" || Array.isArray(data) || Object.keys(data).length === 0) {
    respond(res, false, 400);
    return null;
  }
  return data;
}

/**
 * Rate limiting via Upstash Redis sorted sets (one member per request, scored by timestamp).
 * Fails OPEN (allows the request) if Redis isn't configured or errors — matching the PHP
 * version's own fail-open behavior when its state folder isn't writable.
 */
async function pmsLimit(bucket, key, max, windowSeconds) {
  const r = getRedis();
  if (!r) return true;
  try {
    const redisKey = `pms:${bucket}:${key}`;
    const now = Date.now();
    const windowStart = now - windowSeconds * 1000;
    await r.zremrangebyscore(redisKey, 0, windowStart);
    const count = await r.zcard(redisKey);
    if (count >= max) return false;
    await r.zadd(redisKey, { score: now, member: `${now}-${Math.random().toString(36).slice(2)}` });
    await r.expire(redisKey, windowSeconds + 60);
    return true;
  } catch (err) {
    console.error("[pms-forms] rate limit check failed, allowing request:", err);
    return true;
  }
}

/** The visitor's address, from the headers Vercel's edge network sets. */
function pmsClientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string" && fwd.trim() !== "") return fwd.split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  if (typeof real === "string" && real.trim() !== "") return real.trim();
  return req.socket?.remoteAddress || "unknown";
}

/** Send one plain-text message through the company mailbox over SMTP with implicit TLS (port 465). */
async function pmsSendMail(subject, body, replyEmail, replyName) {
  const host = process.env.SMTP_HOST || "smtp.hostinger.com";
  const port = Number(process.env.SMTP_PORT || 465);
  const user = process.env.SMTP_USERNAME || PMS_MAIL_ADDRESS;
  const pass = process.env.SMTP_PASSWORD;
  if (!pass) {
    console.error("[pms-forms] SMTP_PASSWORD is not configured");
    return false;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: true, // implicit TLS on 465, same as the PHP version (never STARTTLS)
    auth: { user, pass },
    connectionTimeout: 15000,
  });

  try {
    const mail = {
      from: `"${PMS_MAIL_NAME}" <${PMS_MAIL_ADDRESS}>`,
      to: PMS_MAIL_ADDRESS,
      cc: PMS_MAIL_COPY || undefined,
      subject,
      text: body,
    };
    if (replyEmail && pmsValidEmail(replyEmail)) {
      mail.replyTo = replyName ? `"${pmsLine(replyName, 100)}" <${replyEmail}>` : replyEmail;
    }
    await transporter.sendMail(mail);
    return true;
  } catch (err) {
    console.error("[pms-forms] mail failed:", err?.message || err);
    return false;
  }
}

module.exports = {
  respond,
  pmsLine,
  pmsText,
  pmsValidEmail,
  pmsIsBot,
  pmsLinkCount,
  pmsIsJunk,
  pmsMaybeSpam,
  pmsRequest,
  pmsLimit,
  pmsClientIp,
  pmsSendMail,
};
