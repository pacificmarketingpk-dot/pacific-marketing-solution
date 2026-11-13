/** POST /api/newsletter — newsletter sign-up -> email to info@pacificmarketingsolution.com */
const { respond, pmsLine, pmsValidEmail, pmsIsBot, pmsRequest, pmsLimit, pmsClientIp, pmsSendMail } = require("./_lib/common");

module.exports = async (req, res) => {
  const input = await pmsRequest(req, res);
  if (!input) return;

  if (pmsIsBot(input)) return respond(res, true); // spam traps: hidden field, too fast, or no website script

  const email = pmsLine(input.email ?? "", 254);
  const id = pmsLine(input.id ?? "", 80);
  if (!pmsValidEmail(email)) return respond(res, false, 422);

  const clientIp = pmsClientIp(req);
  if (
    !(await pmsLimit("news-ip", clientIp, 5, 600)) ||
    !(await pmsLimit("news-all", "site", 100, 3600))
  ) {
    return respond(res, false, 429);
  }
  if (id !== "" && !(await pmsLimit("news-id", id, 1, 3600))) return respond(res, true);

  const body = `New newsletter subscriber:\n\nEmail: ${email}\n`;

  if (await pmsSendMail("New Newsletter Subscription", body)) return respond(res, true);
  return respond(res, false, 500);
};
