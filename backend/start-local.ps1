
$ErrorActionPreference = "Stop"

Set-Location $PSScriptRoot

$envFile = Join-Path $PSScriptRoot ".env.local"

if (-not (Test-Path $envFile)) {
    throw "Missing backend/.env.local. Create it before starting SentinelAudit."
}

Get-Content $envFile | ForEach-Object {
    $line = $_.Trim()

    if ($line -and -not $line.StartsWith("#") -and $line.Contains("=")) {
        $parts = $line -split "=", 2
        $name = $parts[0].Trim()
        $value = $parts[1].Trim()

        if ($name -notmatch '^[A-Za-z_][A-Za-z0-9_]*$') {
            throw "Invalid environment variable name in .env.local"
        }

        if ($value.Length -ge 2 -and
            (($value.StartsWith('"') -and $value.EndsWith('"')) -or
             ($value.StartsWith("'") -and $value.EndsWith("'")))) {
            $value = $value.Substring(1, $value.Length - 2)
        }

        [Environment]::SetEnvironmentVariable($name, $value, "Process")
    }
}

if (-not $env:JWT_SECRET) { throw "JWT_SECRET is missing." }
if (-not $env:DATABASE_PASSWORD) { throw "DATABASE_PASSWORD is missing." }

.\gradlew.bat bootRun
