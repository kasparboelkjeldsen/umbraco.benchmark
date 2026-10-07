<#
.SYNOPSIS
  Pushes this run folder (tooling, scaffold, notes and the whole archive) to the private umbraco.benchmark repo.

.DESCRIPTION
  Run from the run folder's tools\ (or pass -RunFolder). Pulls the clone (-Clone, default: umbraco.benchmark next to
  the run folder; cloned if missing) so nothing pushed from another machine is lost, syncs the run folder into it with
  bench/publish.mjs --full (machine state and build output left out; nothing under archive/ is ever deleted), commits
  everything and pushes. Archive a sweep first (npm run archive -- --name <name>) so its runs are in archive/.

.EXAMPLE
  .\tools\Push-Benchmark.ps1 -Message "DeepSeek v4 flash at work"
#>
param(
  [string]$RunFolder = (Split-Path -Parent $PSScriptRoot),
  [string]$Clone = "",
  [string]$Repo = "https://github.com/kasparboelkjeldsen/umbraco.benchmark.git",
  [string]$Branch = "main",
  [string]$Message = "",
  [switch]$NoPush
)
# git and npm write progress and warnings to stderr, which Windows PowerShell turns into errors when output is
# captured: native commands are judged by their exit code instead, and cmdlets get -ErrorAction Stop where it matters
$ErrorActionPreference = "Continue"
$RunFolder = [IO.Path]::GetFullPath($RunFolder)
if (-not $Clone) { $Clone = Join-Path (Split-Path $RunFolder -Parent) "umbraco.benchmark" }
$Clone = [IO.Path]::GetFullPath($Clone)
if ($Clone -eq $RunFolder) { throw "-Clone and the run folder must be different folders." }
if (-not $Message) { $Message = "Sync from $env:COMPUTERNAME, $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

if (-not (Test-Path (Join-Path $Clone ".git"))) {
  Write-Host "Cloning $Repo into $Clone ..."
  git clone --quiet $Repo $Clone
  if ($LASTEXITCODE) { throw "git clone failed (a private repo needs this machine's git to be signed in to GitHub)." }
}
git -C $Clone rev-parse --verify -q HEAD | Out-Null
if ($LASTEXITCODE) {
  # an empty repo has no commits yet: the first one goes on $Branch
  git -C $Clone symbolic-ref HEAD "refs/heads/$Branch"
} else {
  Write-Host "Pulling $Clone ..."
  git -C $Clone pull --quiet --ff-only
  if ($LASTEXITCODE) { throw "git pull failed in ${Clone}: resolve it there first." }
}
$gitignore = Join-Path $Clone ".gitignore"
if (-not (Test-Path $gitignore)) { Copy-Item (Join-Path $RunFolder "tools\repo.gitignore") $gitignore }

node (Join-Path $RunFolder "bench\publish.mjs") --full --to $Clone
if ($LASTEXITCODE) { throw "The sync failed (see above)." }

git -C $Clone add -A
if (-not (git -C $Clone status --porcelain)) { Write-Host "Nothing new to commit."; return }
git -C $Clone commit --quiet -m $Message
if ($LASTEXITCODE) { throw "git commit failed." }
git -C $Clone log --oneline -1
if ($NoPush) { Write-Host "Committed in $Clone; not pushed (-NoPush)."; return }
git -C $Clone push --quiet -u origin $Branch
if ($LASTEXITCODE) { throw "git push failed." }
Write-Host "Pushed to $Repo ($Branch)."
