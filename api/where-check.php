<?php
// Temporary: reports only whether pms-secrets.php exists in the expected folders. Does not open it. Will be removed.
header('Content-Type: application/json; charset=utf-8'); header('Cache-Control: no-store');
if (($_GET['t'] ?? '') !== '1396d7539585a78ea04abd1c') { http_response_code(404); exit; }
$root = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
$p1 = dirname($root); $p2 = dirname($p1);
$list = function ($d) { $o = []; foreach ((array)@scandir($d) as $f) { if ($f === '.' || $f === '..') continue; if (stripos($f, 'secret') !== false || $f === 'public_html') $o[] = $f; } return $o; };
echo json_encode([
  'web_folder' => basename($root),
  'level1_folder' => basename($p1), 'level1_has_file' => is_file($p1 . '/pms-secrets.php'), 'level1_matching_names' => $list($p1),
  'level2_folder' => basename($p2), 'level2_has_file' => is_file($p2 . '/pms-secrets.php'), 'level2_matching_names' => $list($p2),
  'inside_web_folder_names' => $list($root),
], JSON_PRETTY_PRINT);
