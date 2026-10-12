// npm run publish -- --to <folder> [--full] [--dry-run]
// Syncs this working copy into another folder.
// Lean (default, for the public kjeldsen.dev/kjeldsen.benchmark): the tooling, the scaffold, the tests and prompts, and
//   the archive's lean record. Left out: live results, screenshots and runner logs, session transcripts and raw CLI
//   streams (they hold the user's email and paths), images in the archive, and the private blog drafts. Stops if any
//   file it would copy contains an email address.
// Full (--full, for the private umbraco.benchmark repo and for installing on another machine): everything, transcripts,
//   screenshots, results and notes included.
// Both leave out machine state: the baseline repo, build output, node_modules, Umbraco's runtime data and
//   run-book.local.json (machine-specific settings), and the target's own .gitignore.
// Files the target has and this copy doesn't are removed, except under archive/: the archive only grows, so a sweep
// recorded on another machine and not yet synced here is never deleted.
// Refuses while Umbraco.Bench isn't pristine.
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { ROOT, parseArgs } from "./lib/common.mjs";
import { changes, hasBaseline } from "./lib/baseline.mjs";

const args = parseArgs();
if (typeof args.to !== "string") { console.error("Usage: npm run publish -- --to <folder> [--full] [--dry-run]"); process.exit(1); }
const TO = path.resolve(args.to);
const DRY = !!args["dry-run"];
const FULL = !!args.full;

// a fresh clone (tools/Get-UmbracoBenchmark.ps1 runs this from one) has no baseline repo: nothing to check
if (hasBaseline()) {
  const ch = changes();
  const dirty = [...ch.added, ...ch.modified, ...ch.deleted].filter(f => f !== ".mcp.json");
  if (dirty.length) { console.error(`✗ Umbraco.Bench isn't pristine (${dirty.length} changed file(s)); npm run reset first.`); process.exit(1); }
}

// paths are relative, with forward slashes
// machine state, build output and the target's own files: never synced
const MACHINE = [
  /^bench\/\.baseline-git(\/|$)/, /(^|\/)node_modules(\/|$)/, /(^|\/)(bin|obj|\.vs)(\/|$)/, /(^|\/)umbraco\/(Data|Logs|mediacache)(\/|$)/i,
  /(^|\/)wwwroot\/media(\/|$)/i, /^run-book\.local\.json$/, /^\.gitignore$/, /^\.git(\/|$)/,
  // the runner's raw per-run streams: each run folder has its own copy
  /^bench\/logs\/auto-.*\.jsonl$/,
  // runs parked on an airgapped network (npm run auto -- --airgapped), waiting to be graded on this machine
  /^bench\/\.parked(\/|$)/,
  // the tripwire's per-session hook settings and trip files (each run folder keeps its own tripwire.jsonl)
  /^bench\/\.tripwire(\/|$)/,
];
// left out of the public lean copy only
const LEAN = [
  /^bench\/logs(\/|$)/, /^results(\/|$)/, /^results-extra(\/|$)/, /^screenshots(\/|$)/,
  /^archive\/.*\/transcript\.jsonl$/, /^archive\/.*-stream\.jsonl$/, /^archive\/.*\/subagents(\/|$)/, /^archive\/.*\.(png|jpe?g)$/i,
  /^(blog-guide-kjeldsen-dev|blog-post|tone-of-voice)\.md$/,
];
const SKIP = FULL ? MACHINE : [...MACHINE, ...LEAN];
const skip = rel => SKIP.some(re => re.test(rel));
const EMAIL = /[A-Za-z0-9._%+-]+@gmail\.com/;

function walk(base, rel = "", out = new Map()) {
  for (const e of fs.readdirSync(path.join(base, rel), { withFileTypes: true })) {
    const r = rel ? `${rel}/${e.name}` : e.name;
    if (skip(r)) continue;
    if (e.isDirectory()) walk(base, r, out);
    else if (e.isFile()) out.set(r, path.join(base, r));
  }
  return out;
}
const hash = f => crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex");

const src = walk(ROOT);
const dst = fs.existsSync(TO) ? walk(TO) : new Map();
const leaks = [];
const add = [], update = [], remove = [];
for (const [rel, f] of src) {
  if (!FULL && /\.(json|jsonl|md|txt|mjs|js|cs|cshtml|html|patch|log|ps1)$/i.test(rel) && EMAIL.test(fs.readFileSync(f, "utf8"))) leaks.push(rel);
  if (!dst.has(rel)) add.push(rel);
  else if (fs.statSync(f).size !== fs.statSync(dst.get(rel)).size || hash(f) !== hash(dst.get(rel))) update.push(rel);
}
// the archive only grows: never delete a recorded run another machine added
for (const rel of dst.keys()) if (!src.has(rel) && !rel.startsWith("archive/")) remove.push(rel);
if (leaks.length) { console.error(`✗ These files contain an email address; scrub them or add them to the skip list:\n  ${leaks.join("\n  ")}`); process.exit(1); }

console.log(`${DRY ? "Would sync" : "Syncing"} ${ROOT} → ${TO}: ${add.length} new, ${update.length} changed, ${remove.length} removed (${src.size} files in the ${FULL ? "full" : "lean"} copy)`);
for (const [label, list] of [["+", add], ["~", update], ["-", remove]]) for (const rel of list.slice(0, 60)) console.log(`  ${label} ${rel}`);
if (add.length + update.length + remove.length > 180) console.log("  …");
if (DRY) process.exit(0);
for (const rel of [...add, ...update]) { const t = path.join(TO, rel); fs.mkdirSync(path.dirname(t), { recursive: true }); fs.copyFileSync(src.get(rel), t); }
for (const rel of remove) fs.rmSync(path.join(TO, rel));
console.log("Done.");
