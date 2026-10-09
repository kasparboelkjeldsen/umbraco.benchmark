// Parking: for runs on a network without internet (an airgapped box), where the Opus grader can't run. A collected run's
// Umbraco.Bench (code, database, media; not bin/obj/node_modules, which a build recreates) is copied to
// bench/.parked/<runId> and the project is reset, so the next run can start. Back online, `npm run auto -- --grade-only`
// copies each one back and grades it as if it had just finished. bench/ is outside the project, like the baseline repo,
// so the model under test never sees it.
// Copies, not a folder rename: Windows refuses to rename Umbraco.Bench while anything (an editor's C# tooling, a build
// server) holds a handle inside it, while deleting and writing files works, which is what reset does anyway.
import fs from "node:fs";
import path from "node:path";
import { ROOT, PROJECT, readJson, writeJson } from "./common.mjs";
import { git, restoreBaseline, changes } from "./baseline.mjs";
import { stopSite } from "./umbraco.mjs";
import { clearVariantState } from "./variants.mjs";

export const PARKED = path.join(ROOT, "bench", ".parked");
const SKIP = new Set(["bin", "obj", "node_modules", ".vs"]);
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Parked runs, oldest first: [{ id, dir, parkedAt }]. A run is parked while bench/.parked/<runId>.json exists.
export function parkedRuns() {
  if (!fs.existsSync(PARKED)) return [];
  return fs.readdirSync(PARKED, { withFileTypes: true }).filter(d => d.isDirectory() && fs.existsSync(path.join(PARKED, `${d.name}.json`)))
    .map(d => ({ id: d.name, dir: path.join(PARKED, d.name), parkedAt: readJson(path.join(PARKED, `${d.name}.json`))?.parkedAt ?? "" }))
    .sort((a, b) => a.parkedAt.localeCompare(b.parkedAt) || a.id.localeCompare(b.id));
}

const copy = (from, to) => fs.cpSync(from, to, { recursive: true, force: true, filter: src => !SKIP.has(path.basename(src)) });

async function retry(what, fn) {
  let err;
  for (let i = 0; i < 5; i++) {
    try { return fn(); } catch (e) { err = e; stopSite(); await sleep(2000); }
  }
  throw new Error(`${what}: ${err.message}`);
}

// Every file goes; a folder only if Windows lets it (a folder something holds a handle on stays, empty, which git and
// the build don't see)
function empty(p) {
  const st = fs.lstatSync(p, { throwIfNoEntry: false });
  if (!st) return;
  if (!st.isDirectory()) { fs.rmSync(p, { force: true }); return; }
  for (const e of fs.readdirSync(p)) empty(path.join(p, e));
  try { fs.rmdirSync(p); } catch {}
}

const projectDirty = () => { const c = changes(); return [...c.added, ...c.modified, ...c.deleted].filter(f => f !== ".mcp.json"); };

// Copies the project (holding runId's solution) to bench/.parked/<runId> and resets it to the pristine scaffold.
// The code also goes into the baseline repo as refs/runs/parked-<runId>, in case the parked copy is lost.
export async function park(runId) {
  const dest = path.join(PARKED, runId);
  sweepLeftovers();
  if (fs.existsSync(dest)) throw new Error(`${dest} already exists`);
  stopSite();
  await sleep(1500);
  git(["add", "-A"]);
  git(["commit", "-q", "--allow-empty", "-m", `parked ${runId}`]);
  git(["update-ref", `refs/runs/parked-${runId}`, "HEAD"]);
  // back on the baseline (worktree untouched), so a failure below still shows the project as changed
  git(["reset", "-q", "baseline"]);
  try { await retry("copying the project", () => copy(PROJECT, dest)); } catch (e) { fs.rmSync(dest, { recursive: true, force: true }); throw e; }
  writeJson(path.join(PARKED, `${runId}.json`), { runId, parkedAt: new Date().toISOString() });
  await retry("resetting the project", () => restoreBaseline());
  clearVariantState();
  return dest;
}

// Puts a parked run back into Umbraco.Bench. The project must be pristine; everything in it but .claude/ (the project's
// Claude Code settings, which aren't in the baseline) is replaced.
export async function unpark(runId) {
  const src = path.join(PARKED, runId);
  if (!fs.existsSync(src)) throw new Error(`${runId} isn't parked`);
  const dirty = projectDirty();
  if (dirty.length) throw new Error(`Umbraco.Bench isn't pristine (${dirty.length} changed file(s)); grade or reset it before unparking ${runId}`);
  stopSite();
  await sleep(1500);
  await retry("emptying the project", () => { for (const e of fs.readdirSync(PROJECT)) if (e !== ".claude") empty(path.join(PROJECT, e)); });
  await retry("copying the run back", () => fs.cpSync(src, PROJECT, { recursive: true, force: true, filter: s => path.relative(src, s) !== ".claude" }));
  // the marker goes first: without it the run is no longer parked, even if the copy can't be removed yet (a virus scanner
  // still reading the files it just saw written); a later park or unpark sweeps such leftovers
  fs.rmSync(path.join(PARKED, `${runId}.json`), { force: true });
  sweepLeftovers();
}

function sweepLeftovers() {
  if (!fs.existsSync(PARKED)) return;
  for (const d of fs.readdirSync(PARKED, { withFileTypes: true }))
    if (d.isDirectory() && !fs.existsSync(path.join(PARKED, `${d.name}.json`)))
      try { fs.rmSync(path.join(PARKED, d.name), { recursive: true, force: true, maxRetries: 10, retryDelay: 500 }); } catch {}
}
