/** POST /api/contact — website contact form -> email to info@pacificmarketingsolution.com */
const {
  respond,
  pmsLine,
  pmsText,
  pmsValidEmail,
  pmsIsBot,
  pmsIsJunk,
  pmsMaybeSpam,
  pmsRequest,
  pmsLimit,
  pmsClientIp,
  pmsSendMail,
} = require("./_lib/common");

module.exports = async (req, res) => {
  const input = await pmsRequest(req, res);
  if (!input) return; // pmsRequest already responded

  // spam traps: hidden field filled in, sent too fast, or sent without the website. A bot gets a
  // normal-looking success response and nothing is sent.
  if (pmsIsBot(input)) return respond(res, true);

  const name = pmsLine(input.name ?? "", 100);
  const email = pmsLine(input.email ?? "", 254);
  const phone = pmsLine(input.phone ?? "", 40);
  const company = pmsLine(input.company ?? "", 160);
  const btype = pmsLine(input.btype ?? "", 120);
  const interest = pmsLine(input.interest ?? "", 120);
  const message = pmsText(input.message ?? "", 4000);
  const id = pmsLine(input.id ?? "", 80);

  if (pmsIsJunk(name, company, message)) return respond(res, true); // obvious junk is dropped quietly

  const digits = phone.replace(/\D/g, "").length;
  const nameLen = Array.from(name).length;
  const companyLen = Array.from(company).length;
  if (
    nameLen < 2 ||
    companyLen < 2 ||
    btype === "" ||
    !pmsValidEmail(email) ||
    !/^[0-9+()\-.\s]{6,40}$/.test(phone) ||
    digits < 6 ||
    digits > 20
  ) {
    return respond(res, false, 422);
  }

  // limits: 3 messages per sender email per day, 3 per visitor address per 10 minutes, 100 per
  // hour for the whole site, and each request id is accepted once
  const clientIp = pmsClientIp(req);
  if (!(await pmsLimit("contact-email", email.toLowerCase(), 3, 86400))) return respond(res, true);
  if (
    !(await pmsLimit("contact-ip", clientIp, 3, 600)) ||
    !(await pmsLimit("contact-all", "site", 100, 3600))
  ) {
    return respond(res, false, 429);
  }
  if (id !== "" && !(await pmsLimit("contact-id", id, 1, 3600))) return respond(res, true); // a repeated send of the same message

  const body =
    "New Website Contact Form Submission\n\n" +
    `Name: ${name}\n` +
    `Email: ${email}\n` +
    `Phone: ${phone}\n` +
    `Company: ${company}\n` +
    `Business type: ${btype}\n` +
    `Interested in: ${interest}\n\n` +
    `Message:\n${message}\n`;

  const subject = (pmsMaybeSpam(message) ? "[Possible spam] " : "") + "New Website Contact Form Submission";
  if (await pmsSendMail(subject, body, email, name)) return respond(res, true);
  return respond(res, false, 500);
};
