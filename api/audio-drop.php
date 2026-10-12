<?php
// TEMPORARY one-off receiver for the ElevenLabs welcome audio files. Removed right after use.
declare(strict_types=1);
header('Access-Control-Allow-Origin: https://storage.googleapis.com');
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
if (($_GET['t'] ?? '') !== 'ab84a2f79dd7ff0a3fdb86cb7ab659f1' || ($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') { http_response_code(404); exit; }
$ok = ['welcome-en.mp3','welcome-fr.mp3','welcome-de.mp3','welcome-ar.mp3','welcome-zh.mp3','welcome-ja.mp3','welcome-es.mp3','welcome-pt.mp3','intro-sfx.mp3'];
$name = (string)($_GET['name'] ?? '');
if (!in_array($name, $ok, true)) { http_response_code(400); echo '{"ok":false,"e":"name"}'; exit; }
$data = (string)file_get_contents('php://input', false, null, 0, 700001);
$n = strlen($data);
$isMp3 = $n > 1000 && (substr($data,0,3) === 'ID3' || (ord($data[0]) === 0xFF && (ord($data[1]) & 0xE0) === 0xE0));
if (!$isMp3 || $n > 700000) { http_response_code(400); echo json_encode(['ok'=>false,'e'=>'type','n'=>$n]); exit; }
$dir = rtrim((string)$_SERVER['DOCUMENT_ROOT'], '/') . '/audio';
if (!is_dir($dir)) { @mkdir($dir, 0755, true); }
$w = @file_put_contents($dir . '/' . $name, $data);
echo json_encode(['ok'=>$w === $n, 'name'=>$name, 'bytes'=>$n, 'sha'=>substr(hash('sha256',$data),0,16)]);
