<?php
// TEMPORARY one-off receiver for 3 Upwork portfolio images. Removed right after use.
declare(strict_types=1);
header('Access-Control-Allow-Origin: https://www.upwork.com');
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
if (($_GET['t'] ?? '') !== '1d34600b5c3a9d0bbb085dc1ca4a2c80' || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(404); exit; }
$ok = ['upwork-voice-coaching.jpg','upwork-legal-rag.jpg','upwork-phone-receptionist.jpg'];
$name = (string)($_GET['name'] ?? '');
if (!in_array($name, $ok, true)) { http_response_code(400); echo '{"ok":false,"e":"name"}'; exit; }
$data = (string)file_get_contents('php://input', false, null, 0, 400001);
$n = strlen($data);
if ($n < 1000 || $n > 400000 || substr($data,0,3) !== "\xFF\xD8\xFF") { http_response_code(400); echo json_encode(['ok'=>false,'e'=>'type','n'=>$n]); exit; }
$dir = rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') . '/media';
if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
$w = @file_put_contents($dir . '/' . $name, $data);
echo json_encode(['ok'=>$w === $n, 'name'=>$name, 'bytes'=>$n]);
