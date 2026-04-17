param(
  [string]$EnvFile = ".env",
  [string]$OutputFile = "k8s/secret.yaml"
)

$ErrorActionPreference = "Stop"

$requiredKeys = @(
  "AUTH_MONGODB_URI",
  "ADMIN_MONGODB_URI",
  "PATIENT_MONGODB_URI",
  "APPOINTMENT_MONGODB_URI",
  "PAYMENT_MONGODB_URI",
  "DOCTOR_MONGODB_URI",
  "NOTIFICATION_MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "INTERNAL_SERVICE_SECRET",
  "EMAIL_USER",
  "EMAIL_PASS",
  "EMAIL_FROM",
  "CLOUDINARY_CLOUD_NAME",
  "CLOUDINARY_API_KEY",
  "CLOUDINARY_API_SECRET",
  "GEMINI_API_KEY",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_ENCRYPTION_KEY",
  "NOTIFY_LK_USER_ID",
  "NOTIFY_LK_API_KEY",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_SMS_FROM",
  "TWILIO_WHATSAPP_FROM"
)

$fallbacks = @{
  GOOGLE_CLIENT_ID     = "change-me"
  GOOGLE_CLIENT_SECRET = "change-me"
  GOOGLE_ENCRYPTION_KEY = "change-me"
  TWILIO_ACCOUNT_SID   = "change-me"
  TWILIO_AUTH_TOKEN    = "change-me"
  TWILIO_SMS_FROM      = "+10000000000"
  TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886"
}

if (-not (Test-Path -LiteralPath $EnvFile)) {
  throw "Environment file not found: $EnvFile"
}

$envValues = @{}

foreach ($line in Get-Content -LiteralPath $EnvFile) {
  $trimmed = $line.Trim()

  if (-not $trimmed -or $trimmed.StartsWith("#")) {
    continue
  }

  $separatorIndex = $line.IndexOf("=")

  if ($separatorIndex -lt 1) {
    continue
  }

  $key = $line.Substring(0, $separatorIndex).Trim()
  $value = $line.Substring($separatorIndex + 1)
  $envValues[$key] = $value
}

foreach ($key in $fallbacks.Keys) {
  if (-not $envValues.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($envValues[$key])) {
    $envValues[$key] = $fallbacks[$key]
  }
}

$missing = $requiredKeys | Where-Object {
  -not $envValues.ContainsKey($_) -or [string]::IsNullOrWhiteSpace($envValues[$_])
}

if ($missing.Count -gt 0) {
  throw "Missing required secret values in ${EnvFile}: $($missing -join ', ')"
}

function Format-YamlString {
  param([string]$Value)

  return "'" + $Value.Replace("'", "''") + "'"
}

$lines = @(
  "apiVersion: v1",
  "kind: Secret",
  "metadata:",
  "  name: smart-health-secrets",
  "  namespace: smart-health",
  "type: Opaque",
  "stringData:"
)

foreach ($key in $requiredKeys) {
  $lines += "  ${key}: $(Format-YamlString $envValues[$key])"
}

$outputDirectory = Split-Path -Parent $OutputFile

if ($outputDirectory -and -not (Test-Path -LiteralPath $outputDirectory)) {
  New-Item -ItemType Directory -Path $outputDirectory | Out-Null
}

Set-Content -LiteralPath $OutputFile -Value $lines -Encoding UTF8
Write-Host "Generated $OutputFile from $EnvFile"
