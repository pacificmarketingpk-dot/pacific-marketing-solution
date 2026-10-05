<?php
/** POST /api/newsletter.php  -  newsletter sign-up -> email to info@pacificmarketingsolution.com */
declare(strict_types=1);
require __DIR__ . '/_lib/common.php';

$in = pms_request();

if (pms_line($in['website'] ?? '', 200) !== '') { pms_respond(true); }                // hidden trap field

$email = pms_line($in['email'] ?? '', 254);
$id    = pms_line($in['id'] ?? '', 80);
if (!pms_valid_email($email)) { pms_respond(false, 422); }

if (!pms_limit('news-ip', pms_client_ip(), 5, 600) || !pms_limit('news-all', 'site', 100, 3600)) { pms_respond(false, 429); }
if ($id !== '' && !pms_limit('news-id', $id, 1, 3600)) { pms_respond(true); }

$body = "New newsletter subscriber:\n\nEmail: {$email}\n";

if (pms_send_mail('New Newsletter Subscription', $body)) { pms_respond(true); }
pms_respond(false, 500);
