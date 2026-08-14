# Paste 4 giá trị Render Blueprint — chạy: .\deploy\fill-render.ps1
param(
  [switch]$CopyAll
)

$envFile = Join-Path $PSScriptRoot "render-paste.env"
if (-not (Test-Path $envFile)) {
  Write-Host "Thiếu deploy/render-paste.env" -ForegroundColor Red
  exit 1
}

$vars = @{}
Get-Content $envFile | ForEach-Object {
  if ($_ -match '^\s*#' -or $_ -match '^\s*$') { return }
  $parts = $_ -split '=', 2
  if ($parts.Count -eq 2) { $vars[$parts[0].Trim()] = $parts[1].Trim() }
}

$order = @(
  @{ Key = 'MONGODB_URI'; Label = '1/4 MONGODB_URI' },
  @{ Key = 'SEPAY_WEBHOOK_SECRET'; Label = '2/4 SEPAY_WEBHOOK_SECRET' },
  @{ Key = 'PUBLIC_API_URL'; Label = '3/4 PUBLIC_API_URL' },
  @{ Key = 'CORS_ORIGIN'; Label = '4/4 CORS_ORIGIN' }
)

Write-Host ""
Write-Host "=== RENDER BLUEPRINT — paste từng ô (Ctrl+V) ===" -ForegroundColor Cyan
Write-Host "Trang Render đang mở → dán lần lượt 4 ô → bấm Deploy Blueprint" -ForegroundColor Yellow
Write-Host ""

foreach ($item in $order) {
  $val = $vars[$item.Key]
  if (-not $val) { continue }
  Set-Clipboard -Value $val
  Write-Host "[$($item.Label)] đã copy clipboard:" -ForegroundColor Green
  if ($item.Key -match 'SECRET|URI') {
    Write-Host "  ($($item.Key) — $($val.Length) ký tự, không hiển thị)" -ForegroundColor DarkGray
  } else {
    Write-Host "  $val" -ForegroundColor White
  }
  if (-not $CopyAll) {
    Read-Host "  → Dán vào Render rồi Enter để copy ô tiếp theo"
  }
}

Write-Host ""
Write-Host "Xong 4 ô → bấm Deploy Blueprint trên Render." -ForegroundColor Cyan
Write-Host "SePay webhook sau deploy:" -ForegroundColor Cyan
Write-Host "  https://bobapos-api.onrender.com/api/payments/sepay/webhook" -ForegroundColor White
