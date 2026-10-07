<#
.SYNOPSIS
  Installs or updates a run folder of the Umbraco benchmark from the private umbraco.benchmark repo.

.DESCRIPTION
  Keeps a clone of the repo (-Clone, default: umbraco.benchmark next to the run folder), pulls it, and syncs it into
  the run folder (-Target) with the benchmark's own sync (bench/publish.mjs --full). Runs happen in the run folder, never
  in the clone: inside a git checkout a model under test could read the whole repo (npm run auto refuses).
  The sync never touches the run folder's machine state (baseline repo, build output, run-book.local.json) and never
  deletes from archive/, so sweeps recorded here and not yet pushed are safe. It refuses while a run is in progress.
  First install records the baseline. With -Model it ends with the quick preflight.
  Push results back with tools\Push-Benchmark.ps1 (from the run folder).

.EXAMPLE
  # first time on a machine: get the clone, then let its copy of this script set up the run folder
  git clone https://github.com/kasparboelkjeldsen/umbraco.benchmark.git X:\code\umbraco.benchmark
  X:\code\umbraco.benchmark\tools\Get-UmbracoBenchmark.ps1 -Target X:\code\umbraco-benchmark

.EXAMPLE
  # later: pull and update the run folder (from anywhere)
  X:\code\umbraco-benchmark\tools\Get-UmbracoBenchmark.ps1 -Target X:\code\umbraco-benchmark -Model deepseek-v4-flash
#>
param(
  [string]$Target = "X:\code\umbraco-benchmark",
  [string]$Clone = "",
  [string]$Repo = "https://github.com/kasparboelkjeldsen/umbraco.benchmark.git",
  [string]$Branch = "main",
  # the benchmark's folder inside the repo ("" = the repo root; "kjeldsen.benchmark" for the public kjeldsen.dev copy)
  [string]$Subfolder = "",
  [string]$Model = "",
  [switch]$Force
)
# git and npm write progress and warnings to stderr, which Windows PowerShell turns into errors when output is
# captured: native commands are judged by their exit code instead, and cmdlets get -ErrorAction Stop where it matters
$ErrorActionPreference = "Continue"
$Target = [IO.Path]::GetFullPath($Target)
if (-not $Clone) { $Clone = Join-Path (Split-Path $Target -Parent) "umbraco.benchmark" }
$Clone = [IO.Path]::GetFullPath($Clone)
if ($Clone -eq $Target) { throw "-Clone and -Target must be different folders: runs can't happen inside the git clone." }

# ---- prerequisites
foreach ($tool in "git", "node", "npm", "dotnet") {
  if (-not (Get-Command $tool -ErrorAction SilentlyContinue)) { throw "$tool isn't on PATH." }
}
$nodeMajor = [int]((node --version).TrimStart("v").Split(".")[0])
if ($nodeMajor -lt 20) { throw "Node $nodeMajor found; the benchmark needs Node 20 or newer." }
if (-not (dotnet --list-sdks | Select-String "^10\.")) { Write-Warning ".NET 10 SDK not found (dotnet --list-sdks). Umbraco 18 needs it." }
if (-not (Get-Command claude -ErrorAction SilentlyContinue)) { Write-Warning "The Claude Code CLI (claude) isn't on PATH. Install it, or pass --claude <path> to npm run auto." }
if (Test-Path $Target) {
  git -C $Target rev-parse --show-toplevel 2>$null | Out-Null
  if ($LASTEXITCODE -eq 0) { throw "$Target is inside a git checkout. Pick a run folder outside git." }
}

# ---- clone or pull
if (-not (Test-Path (Join-Path $Clone ".git"))) {
  Write-Host "Cloning $Repo into $Clone ..."
  git clone --quiet --branch $Branch $Repo $Clone
  if ($LASTEXITCODE) { throw "git clone failed (a private repo needs this machine's git to be signed in to GitHub)." }
} else {
  Write-Host "Pulling $Clone ..."
  git -C $Clone pull --quiet --ff-only
  if ($LASTEXITCODE) { throw "git pull failed in $Clone." }
}
$src = if ($Subfolder) { Join-Path $Clone $Subfolder } else { $Clone }

# ---- not in the middle of a run
$firstInstall = -not (Test-Path (Join-Path $Target "bench\.baseline-git"))
if (-not $firstInstall -and -not $Force) {
  $status = node (Join-Path $Target "bench\status.mjs") 2>&1 | Out-String
  if ($status -notmatch "Project\s+pristine") { throw "The run folder isn't pristine (a run in progress or not reset). Finish it or npm run reset -- --force first, or pass -Force.`n$status" }
}

# ---- sync into the run folder
New-Item -ItemType Directory -Force $Target -ErrorAction Stop | Out-Null
node (Join-Path $src "bench\publish.mjs") --full --to $Target
if ($LASTEXITCODE) { throw "The sync failed (see above)." }

# ---- baseline and checks
Push-Location $Target -ErrorAction Stop
try {
  if ($firstInstall) {
    Write-Host "`nFirst install: recording the pristine scaffold as the baseline ..."
    npm run --silent baseline
  } else {
    Write-Host "`nUpdated. If the scaffold itself changed (Umbraco.Bench), npm run status shows it as not pristine; then: npm run baseline -- --force"
  }
  npm run --silent status
  if ($Model) { npm run --silent preflight -- --model $Model --quick }
} finally { Pop-Location }

Write-Host @"

Next steps, in $Target
  1. API key for this session (never stored in a file):   `$env:DEEPSEEK_API_KEY = "sk-..."
  2. Machine-specific settings (another base URL, model id, budget) go in run-book.local.json, which syncs never
     touch, e.g.  { "remote": { "baseUrl": "https://.../anthropic", "models": ["deepseek-v4-flash"] } }
  3. npm run preflight -- --model deepseek-v4-flash      (~3 min: key, endpoint, tool calls, Claude Code, Umbraco, MCP)
  4. npm run auto -- --model deepseek-v4-flash           (one run, graded by Opus if this Claude Code login has it;
                                                          add --no-grade to grade later at home)
  5. npm run archive -- --name <yyyy-mm-dd>-work, then .\tools\Push-Benchmark.ps1 to push the results to the repo
     (or .\tools\Export-BenchmarkResults.ps1 for a zip, if this machine can't push)
"@
