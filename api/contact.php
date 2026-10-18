<?php
/** POST /api/contact.php  -  website contact form -> email to info@pacificmarketingsolution.com */
declare(strict_types=1);
require __DIR__ . '/_lib/common.php';

$in = pms_request();

// spam traps: hidden field filled in, sent too fast, or sent without the website. A bot gets a normal-looking answer and nothing is sent.
if (pms_is_bot($in)) { pms_respond(true); }

$name     = pms_line($in['name'] ?? '', 100);
$email    = pms_line($in['email'] ?? '', 254);
$phone    = pms_line($in['phone'] ?? '', 40);
$company  = pms_line($in['company'] ?? '', 160);
$btype    = pms_line($in['btype'] ?? '', 120);
$interest = pms_line($in['interest'] ?? '', 120);
$message  = pms_text($in['message'] ?? '', 4000);
$id       = pms_line($in['id'] ?? '', 80);

if (pms_is_junk($name, $company, $message)) { pms_respond(true); }               // obvious junk is dropped quietly

$digits = strlen((string)preg_replace('/\D/', '', $phone));
if (mb_strlen($name, 'UTF-8') < 2 || mb_strlen($company, 'UTF-8') < 2 || $btype === '' || !pms_valid_email($email) || !preg_match('/^[0-9+()\-.\s]{6,40}$/', $phone) || $digits < 6 || $digits > 20) {
    pms_respond(false, 422);
}

// limits: 3 messages per sender email per day, 3 per visitor address per 10 minutes, 100 per hour for the whole site, and each request id is accepted once
if (!pms_limit('contact-email', strtolower($email), 3, 86400)) { pms_respond(true); }   // max 3 messages per sender address per day
if (!pms_limit('contact-ip', pms_client_ip(), 3, 600) || !pms_limit('contact-all', 'site', 100, 3600)) { pms_respond(false, 429); }
if ($id !== '' && !pms_limit('contact-id', $id, 1, 3600)) { pms_respond(true); }      // a repeated send of the same message

$body = "New Website Contact Form Submission\n\n"
      . "Name: {$name}\n"
      . "Email: {$email}\n"
      . "Phone: {$phone}\n"
      . "Company: {$company}\n"
      . "Business type: {$btype}\n"
      . "Interested in: {$interest}\n\n"
      . "Message:\n{$message}\n";

$subject = (pms_maybe_spam($message) ? '[Possible spam] ' : '') . 'New Website Contact Form Submission';
if (pms_send_mail($subject, $body, $email, $name)) { pms_respond(true); }
pms_respond(false, 500);
