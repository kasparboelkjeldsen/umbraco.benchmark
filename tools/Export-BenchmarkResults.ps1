<#
.SYNOPSIS
  Packs this machine's benchmark runs into one zip to carry home (to be merged into the archive there).

.DESCRIPTION
  Archives the current results as a sweep (npm run archive -- --name <Name>), then zips that sweep folder, with
  transcripts and screenshots, to -OutDir. Refuses (like npm run archive) while Umbraco is running or a run is ungraded;
  pass -Ungraded to pack ungraded runs as they are (grade them at home).
  The zip can hold this machine's paths and account details from the transcripts: keep it private.

.EXAMPLE
  .\tools\Export-BenchmarkResults.ps1 -Name 2026-10-07-work-deepseek
#>
param(
  [string]$Name = ("{0:yyyy-MM-dd}-work" -f (Get-Date)),
  [string]$OutDir = [Environment]::GetFolderPath("Desktop"),
  [switch]$Ungraded
)
# git and npm write progress and warnings to stderr, which Windows PowerShell turns into errors when output is
# captured: native commands are judged by their exit code instead, and cmdlets get -ErrorAction Stop where it matters
$ErrorActionPreference = "Continue"
$root = Split-Path -Parent $PSScriptRoot
Push-Location $root -ErrorAction Stop
try {
  if ($Ungraded) {
    # ungraded runs can't be archived by npm run archive; pack results/ and screenshots/ as they are
    $sweep = Join-Path $env:TEMP "bench-export-$Name"
    Remove-Item -Recurse -Force $sweep -ErrorAction SilentlyContinue
    New-Item -ItemType Directory -Force $sweep -ErrorAction Stop | Out-Null
    foreach ($d in "results", "screenshots") { if (Test-Path $d) { Copy-Item -Recurse $d (Join-Path $sweep $d) } }
    Copy-Item run-book.json $sweep -ErrorAction Stop
    if (Test-Path run-book.local.json) { Copy-Item run-book.local.json $sweep }
    # the runs' archived solutions live in the baseline repo; bundle them so they can be graded at home
    git --git-dir=bench/.baseline-git bundle create (Join-Path $sweep "runs.bundle") --all 2>$null
  } else {
    npm run --silent archive -- --name $Name
    if ($LASTEXITCODE) { throw "npm run archive refused (see above). Grade or discard the open run first, or use -Ungraded." }
    $sweep = Join-Path $root "archive\sweeps\$Name"
  }
  $zip = Join-Path $OutDir "umbraco-benchmark-$Name.zip"
  if (Test-Path $zip) { Remove-Item $zip }
  Compress-Archive -Path (Join-Path $sweep "*") -DestinationPath $zip -ErrorAction Stop
  Write-Host "`n$zip ($([math]::Round((Get-Item $zip).Length / 1MB, 1)) MB). Bring it home and unpack it into archive\sweeps\$Name\."
} finally { Pop-Location }
