<?php
// Temporary diagnostic for the contact form. Shows only yes/no facts, never the password. Will be removed.
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
if (($_GET['t'] ?? '') !== '03a29e8a3edd2618c6ff7a3e') { http_response_code(404); exit; }
require __DIR__ . '/_lib/common.php';
$out = [];
$root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
$out['document_root_ends_with'] = basename($root);
$d = pms_private_dir();
$cands = $d ? [$d . '/pms-secrets.php', dirname($d) . '/pms-secrets.php'] : [];
foreach ($cands as $i => $c) { $out['candidate_'.$i] = ['folder' => basename(dirname($c)), 'exists' => is_file($c), 'readable' => is_readable($c)]; }
$out['secret_in_public_html'] = is_file($root . '/pms-secrets.php');
foreach (['SMTP_HOST','SMTP_PORT','SMTP_USERNAME'] as $k) { $out[$k] = pms_secret($k); }
$p = pms_secret('SMTP_PASSWORD'); $out['password_found'] = $p !== null; $out['password_length'] = $p ? strlen($p) : 0;
if ($p !== null) {
  require_once __DIR__ . '/vendor/phpmailer/Exception.php'; require_once __DIR__ . '/vendor/phpmailer/PHPMailer.php'; require_once __DIR__ . '/vendor/phpmailer/SMTP.php';
  $s = new PHPMailer\PHPMailer\SMTP(); $s->Timeout = 15;
  $h = pms_secret('SMTP_HOST') ?? 'smtp.hostinger.com'; $port = (int)(pms_secret('SMTP_PORT') ?? '465');
  $out['connect'] = $s->connect('ssl://' . $h, $port, 15);
  $out['hello'] = $out['connect'] ? $s->hello('pacificmarketingsolution.com') : false;
  $out['login_ok'] = $out['hello'] ? $s->authenticate(pms_secret('SMTP_USERNAME') ?? 'info@pacificmarketingsolution.com', $p) : false;
  $e = $s->getError(); $out['smtp_error'] = trim(($e['error'] ?? '') . ' ' . ($e['detail'] ?? '') . ' ' . ($e['smtp_code'] ?? ''));
  if ($out['connect']) $s->quit();
}
echo json_encode($out, JSON_PRETTY_PRINT|JSON_UNESCAPED_SLASHES);
