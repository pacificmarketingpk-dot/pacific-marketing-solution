/**
 * Form backend for the website (contact form + newsletter form).
 *
 * It runs inside the Google account pacificmarketing.pk@gmail.com, so no passwords, SMTP details or API
 * keys exist anywhere in the website. The website only knows this script's public web-app URL.
 *
 * One-time setup (about 5 minutes)
 *  1. Sign in to Google as pacificmarketing.pk@gmail.com and open https://script.google.com
 *  2. Click "New project", delete the sample code and paste this whole file. Save.
 *  3. Click "Deploy" -> "New deployment" -> type "Web app".
 *       Execute as: Me (pacificmarketing.pk@gmail.com)
 *       Who has access: Anyone
 *     Click Deploy and approve the permission to send email.
 *  4. Copy the Web app URL (it ends with /exec) and send it to the person editing the website.
 *     It goes into the FORM_ENDPOINT setting in the website code.
 *  5. Test: open the Web app URL in a browser. You should see {"ok":true,"service":"forms"}.
 *
 * When you change this code later, use Deploy -> Manage deployments -> edit -> New version.
 * Gmail limits how many emails a script may send per day (about 100 for a normal Gmail account).
 */

var CONFIG = {
  OWNER_EMAIL: 'pacificmarketing.pk@gmail.com',   // every submission is emailed here
  SENDER_NAME: 'Pacific Marketing Website',
  TIME_ZONE: 'Asia/Karachi',                       // used for the date/time written in the email
  MAX_PER_EMAIL_PER_HOUR: 5,                       // spam protection
  MAX_PER_DAY: 80                                  // stays below Gmail's daily sending limit
};

var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function doGet() {
  return json_({ ok: true, service: 'forms' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(15000);
  } catch (err) {
    return json_({ ok: false, error: 'busy' });
  }
  try {
    var body = JSON.parse((e && e.postData && e.postData.contents) || '{}');

    // 1) spam trap: real visitors never fill this hidden field
    if (body.website) return json_({ ok: true });

    var type = body.type;
    var email = clean_(body.email, 200, false).toLowerCase();
    var page = clean_(body.page, 500, false);
    var id = clean_(body.id, 80, false);
    if ((type !== 'contact' && type !== 'newsletter') || !EMAIL_RE.test(email)) {
      return json_({ ok: false, error: 'invalid' });
    }

    var cache = CacheService.getScriptCache();

    // 2) the same submission sent twice (for example a retry) is only emailed once
    if (id && cache.get('id_' + id)) return json_({ ok: true, duplicate: true });

    // 3) rate limits
    var today = Utilities.formatDate(new Date(), CONFIG.TIME_ZONE, 'yyyyMMdd');
    var dayKey = 'day_' + today;
    var dayCount = Number(cache.get(dayKey) || 0);
    if (dayCount >= CONFIG.MAX_PER_DAY) return json_({ ok: false, error: 'rate_limited' });
    var mailKey = 'rl_' + email;
    var mailCount = Number(cache.get(mailKey) || 0);
    if (mailCount >= CONFIG.MAX_PER_EMAIL_PER_HOUR) return json_({ ok: false, error: 'rate_limited' });

    var now = new Date();
    var when = Utilities.formatDate(now, CONFIG.TIME_ZONE, "EEEE d MMMM yyyy, h:mm a (z)") +
               '  |  ' + now.toISOString();

    var mail;
    if (type === 'contact') {
      var name = clean_(body.name, 120, false);
      var phone = clean_(body.phone, 40, false);
      var company = clean_(body.company, 160, false);
      var interest = clean_(body.interest, 120, false);
      var message = clean_(body.message, 2000, true);
      var digits = phone.replace(/\D/g, '').length;
      if (name.length < 2 || !/^[0-9+()\-.\s]+$/.test(phone) || digits < 6 || digits > 20) {
        return json_({ ok: false, error: 'invalid' });   // name and phone number are required
      }
      if ((message.match(/https?:\/\//gi) || []).length > 3) return json_({ ok: false, error: 'invalid' }); // link spam

      mail = {
        to: CONFIG.OWNER_EMAIL,
        subject: 'New Website Enquiry',
        replyTo: email,
        name: CONFIG.SENDER_NAME,
        body:
          'New Website Enquiry\n\n' +
          'Name: ' + name + '\n' +
          'Email: ' + email + '\n' +
          'Phone: ' + phone + '\n' +
          'Company: ' + company + '\n' +
          'Interested in: ' + interest + '\n\n' +
          'Message:\n' + message + '\n\n' +
          'Date/Time: ' + when + '\n' +
          'Website page URL: ' + page + '\n'
      };
    } else {
      mail = {
        to: CONFIG.OWNER_EMAIL,
        subject: 'New Newsletter Subscriber',
        name: CONFIG.SENDER_NAME,
        body:
          'New Newsletter Subscriber\n\n' +
          'Email: ' + email + '\n\n' +
          'Date/Time:\n' + when + '\n\n' +
          'Website:\n' + page + '\n'
      };
    }

    MailApp.sendEmail(mail);   // plain-text email: nothing the visitor typed is ever treated as HTML

    cache.put(mailKey, String(mailCount + 1), 3600);
    cache.put(dayKey, String(dayCount + 1), 86400);
    if (id) cache.put('id_' + id, '1', 600);
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, error: 'server' });
  } finally {
    lock.releaseLock();
  }
}

/* ---------- helpers ---------- */

// Removes control characters and limits the length. Newlines are kept only where asked.
function clean_(value, max, keepNewlines) {
  var v = String(value == null ? '' : value);
  v = keepNewlines
    ? v.replace(/[\u0000-\u0009\u000b\u000c\u000e-\u001f\u007f]/g, ' ')
    : v.replace(/[\u0000-\u001f\u007f]/g, ' ').replace(/\s+/g, ' ');
  return v.trim().slice(0, max);
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
