<?php
/**
 * Pacific Marketing Solution: shared code for the website forms.
 * Server-side only. Nothing in this file contains a password: the SMTP password is read at run time
 * from a private file above the web folder (or from an environment variable). See README.md.
 */
declare(strict_types=1);

ini_set('display_errors', '0');          // never show PHP or SMTP errors to visitors
ini_set('log_errors', '1');              // errors go to the server's own log instead
error_reporting(E_ALL);

const PMS_MAIL_ADDRESS = 'info@pacificmarketingsolution.com';
const PMS_MAIL_NAME    = 'Pacific Marketing Solution';

/** Send the JSON answer and stop. Only {"ok":true} or {"ok":false,"message":"..."} ever leave this file. */
function pms_respond(bool $ok, int $status = 200): void
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    header('X-Content-Type-Options: nosniff');
    header('X-Robots-Tag: noindex');
    echo $ok ? '{"ok":true}' : '{"ok":false,"message":"Unable to send your message."}';
    exit;
}

/** Folder above the public web folder (not reachable from the internet), or null. */
function pms_private_dir(): ?string
{
    $root = isset($_SERVER['DOCUMENT_ROOT']) ? rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/\\') : '';
    if ($root === '') { return null; }
    $parent = dirname($root);
    return ($parent !== '' && $parent !== $root && is_dir($parent)) ? $parent : null;
}

/** Read one setting: first from the environment, then from pms-secrets.php kept outside the web folder. */
function pms_secret(string $name): ?string
{
    static $file = null;
    foreach ([getenv($name), $_SERVER[$name] ?? null, $_ENV[$name] ?? null] as $v) {
        if (is_string($v) && $v !== '') { return $v; }
    }
    if ($file === null) {
        $file = [];
        $candidates = [];
        $explicit = getenv('PMS_SECRETS_FILE');
        if (is_string($explicit) && $explicit !== '') { $candidates[] = $explicit; }
        if (($d = pms_private_dir()) !== null) { $candidates[] = $d . '/pms-secrets.php'; $candidates[] = dirname($d) . '/pms-secrets.php'; }
        foreach ($candidates as $c) {
            if (is_file($c) && is_readable($c)) {
                $data = include $c;                      // the file returns an array and prints nothing
                if (is_array($data)) { $file = $data; break; }
            }
        }
    }
    $v = $file[$name] ?? null;
    return (is_string($v) && $v !== '') ? $v : null;
}

/** A single line of text: control characters (including line breaks) become spaces, then it is shortened. */
function pms_line($v, int $max): string
{
    $s = is_string($v) ? $v : '';
    $s = (string)preg_replace('/[\x00-\x1F\x7F\x{2028}\x{2029}]+/u', ' ', $s);
    $s = trim((string)preg_replace('/\s{2,}/u', ' ', $s));
    return mb_substr($s, 0, $max, 'UTF-8');
}

/** Longer text with line breaks kept as plain newlines. */
function pms_text($v, int $max): string
{
    $s = is_string($v) ? $v : '';
    $s = str_replace(["\r\n", "\r"], "\n", $s);
    $s = (string)preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/', '', $s);
    $s = trim((string)preg_replace("/\n{3,}/", "\n\n", $s));
    return mb_substr($s, 0, $max, 'UTF-8');
}

function pms_valid_email(string $e): bool
{
    return $e !== '' && strlen($e) <= 254 && !preg_match('/[\s,;<>"\\\\]/', $e) && filter_var($e, FILTER_VALIDATE_EMAIL) !== false;
}

/** Read the request: POST only, same-origin only, small JSON body. */
function pms_request(): array
{
    if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { header('Allow: POST'); pms_respond(false, 405); }
    $origin = $_SERVER['HTTP_ORIGIN'] ?? '';
    if ($origin !== '') {                                  // browsers send this; a different site is refused
        $oh = strtolower((string)parse_url($origin, PHP_URL_HOST) . ((($p = parse_url($origin, PHP_URL_PORT)) ? ':' . $p : '')));
        $hh = strtolower((string)($_SERVER['HTTP_HOST'] ?? ''));
        if ($oh === '' || $oh !== $hh) { pms_respond(false, 403); }
    }
    $len = (int)($_SERVER['CONTENT_LENGTH'] ?? 0);
    if ($len > 20000) { pms_respond(false, 413); }
    $raw = (string)file_get_contents('php://input', false, null, 0, 20001);
    if (strlen($raw) > 20000) { pms_respond(false, 413); }
    $data = json_decode($raw, true);
    if (!is_array($data)) { $data = $_POST; }
    if (!is_array($data) || !$data) { pms_respond(false, 400); }
    return $data;
}

/** Simple file-based limits: per visitor address and per request id. Fails open if no folder is writable. */
function pms_limit(string $bucket, string $key, int $max, int $windowSeconds): bool
{
    $base = pms_private_dir();
    $dir = (($base !== null && is_writable($base)) ? $base : sys_get_temp_dir()) . '/pms-forms-state';
    if (!is_dir($dir) && !@mkdir($dir, 0700, true) && !is_dir($dir)) { return true; }
    $file = $dir . '/' . $bucket . '-' . hash('sha256', $key) . '.json';
    $now = time();
    $fh = @fopen($file, 'c+');
    if (!$fh) { return true; }
    flock($fh, LOCK_EX);
    $hits = json_decode((string)stream_get_contents($fh), true);
    $hits = is_array($hits) ? array_values(array_filter($hits, static fn($t) => is_int($t) && $t > $now - $windowSeconds)) : [];
    $allowed = count($hits) < $max;
    if ($allowed) { $hits[] = $now; }
    ftruncate($fh, 0); rewind($fh); fwrite($fh, json_encode($hits));
    flock($fh, LOCK_UN); fclose($fh);
    return $allowed;
}

/** The visitor's address. Behind Hostinger's CDN the real address arrives in a header; otherwise the connection address. */
function pms_client_ip(): string
{
    foreach (['HTTP_CF_CONNECTING_IP', 'HTTP_X_REAL_IP'] as $h) {
        $v = trim((string)($_SERVER[$h] ?? ''));
        if ($v !== '' && filter_var($v, FILTER_VALIDATE_IP) !== false) { return $v; }
    }
    return (string)($_SERVER['REMOTE_ADDR'] ?? 'unknown');
}

/** Send one plain-text message through the company mailbox over SMTP with implicit TLS (port 465). */
function pms_send_mail(string $subject, string $body, ?string $replyEmail = null, ?string $replyName = null): bool
{
    require_once __DIR__ . '/../vendor/phpmailer/Exception.php';
    require_once __DIR__ . '/../vendor/phpmailer/PHPMailer.php';
    require_once __DIR__ . '/../vendor/phpmailer/SMTP.php';

    $host = pms_secret('SMTP_HOST') ?? 'smtp.hostinger.com';
    $port = (int)(pms_secret('SMTP_PORT') ?? '465');
    $user = pms_secret('SMTP_USERNAME') ?? PMS_MAIL_ADDRESS;
    $pass = pms_secret('SMTP_PASSWORD');
    if ($pass === null) { error_log('[pms-forms] SMTP_PASSWORD is not configured on the server'); return false; }

    $mail = new PHPMailer\PHPMailer\PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host       = $host;
        $mail->Port       = $port;
        $mail->SMTPAuth   = true;
        $mail->Username   = $user;
        $mail->Password   = $pass;
        $mail->SMTPSecure = PHPMailer\PHPMailer\PHPMailer::ENCRYPTION_SMTPS;   // implicit TLS: never STARTTLS on 465
        $mail->SMTPAutoTLS = false;
        $mail->SMTPDebug  = 0;
        $mail->Timeout    = 15;
        if (in_array($host, ['127.0.0.1', 'localhost'], true)) {                // local testing only: a self-made certificate
            $mail->SMTPOptions = ['ssl' => ['verify_peer' => false, 'verify_peer_name' => false, 'allow_self_signed' => true]];
        }
        $mail->Hostname   = 'pacificmarketingsolution.com';
        $mail->CharSet    = 'UTF-8';
        $mail->Encoding   = 'quoted-printable';
        $mail->setFrom(PMS_MAIL_ADDRESS, PMS_MAIL_NAME, true);                  // From is always the company mailbox
        $mail->addAddress(PMS_MAIL_ADDRESS);
        if ($replyEmail !== null && pms_valid_email($replyEmail)) {
            $mail->addReplyTo($replyEmail, $replyName !== null ? pms_line($replyName, 100) : '');
        }
        $mail->isHTML(false);
        $mail->Subject = $subject;
        $mail->Body    = $body;
        return $mail->send();
    } catch (Throwable $e) {
        error_log('[pms-forms] mail failed: ' . get_class($e) . ' (details are not shown to visitors)');
        return false;
    }
}
