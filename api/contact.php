<?php
/** POST /api/contact.php  -  website contact form -> email to info@pacificmarketingsolution.com */
declare(strict_types=1);
require __DIR__ . '/_lib/common.php';

$in = pms_request();

// hidden trap field: real visitors leave it empty. A bot gets a normal-looking answer and nothing is sent.
if (pms_line($in['website'] ?? '', 200) !== '') { pms_respond(true); }

$name     = pms_line($in['name'] ?? '', 100);
$email    = pms_line($in['email'] ?? '', 254);
$phone    = pms_line($in['phone'] ?? '', 40);
$company  = pms_line($in['company'] ?? '', 160);
$interest = pms_line($in['interest'] ?? '', 120);
$message  = pms_text($in['message'] ?? '', 4000);
$id       = pms_line($in['id'] ?? '', 80);

$digits = strlen((string)preg_replace('/\D/', '', $phone));
if (mb_strlen($name, 'UTF-8') < 2 || !pms_valid_email($email) || !preg_match('/^[0-9+()\-.\s]{6,40}$/', $phone) || $digits < 6 || $digits > 20) {
    pms_respond(false, 422);
}

// limits: 5 messages per visitor address per 10 minutes, 100 per hour for the whole site, and each request id is accepted once
if (!pms_limit('contact-ip', pms_client_ip(), 5, 600) || !pms_limit('contact-all', 'site', 100, 3600)) { pms_respond(false, 429); }
if ($id !== '' && !pms_limit('contact-id', $id, 1, 3600)) { pms_respond(true); }      // a repeated send of the same message

$body = "New Website Contact Form Submission\n\n"
      . "Name: {$name}\n"
      . "Email: {$email}\n"
      . "Phone: {$phone}\n"
      . "Company: {$company}\n"
      . "Interested in: {$interest}\n\n"
      . "Message:\n{$message}\n";

if (pms_send_mail('New Website Contact Form Submission', $body, $email, $name)) { pms_respond(true); }
pms_respond(false, 500);
