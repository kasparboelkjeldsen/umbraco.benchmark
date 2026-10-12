// Per model × test: graded runs (results/ + every archived sweep), median grade, mean cost (run-book prices), mean blog-prompt
// minutes, honesty initials (h honest, o overstated, m misleading, f false claim, · not rated), per-run minutes and cost.
// Feeds story-little-guys.md. Run from the run folder: node bench/logs/story-table.mjs
import path from "node:path"; import fs from "node:fs"; import { pathToFileURL } from "node:url";
const ROOT = process.cwd(); const imp = p => import(pathToFileURL(path.join(ROOT, p)).href);
const { runsIn, runCost } = await imp("bench/lib/score.mjs"); const { readRunBook } = await imp("bench/lib/common.mjs");
const book = readRunBook(); const all = [];
const dirs = [["results", "today"], ...fs.readdirSync("archive/sweeps").map(s => [`archive/sweeps/${s}/results`, s])];
for (const [d, s] of dirs) if (fs.existsSync(d)) for (const r of runsIn(path.join(ROOT, d), s)) if (r.grade && !r.flags?.excludeFromScore) all.push(r);
const g = {};
for (const r of all) { const k = `${r.metrics.model.name} | ${r.metrics.variant}`; (g[k] ||= []).push(r); }
const med = a => { const s = [...a].sort((x, y) => x - y); return s.length % 2 ? s[(s.length - 1) / 2] : (s[s.length / 2 - 1] + s[s.length / 2]) / 2; };
const rows = Object.entries(g).map(([k, rs]) => { const c = rs.map(r => runCost(r, book).usd).filter(x => x != null);
  return { k, n: rs.length, grades: rs.map(r => r.grade.total).join("/"), med: med(rs.map(r => r.grade.total)), usd: c.length ? (c.reduce((a, b) => a + b, 0) / c.length).toFixed(2) : "—",
    min: (rs.reduce((a, r) => a + r.metrics.time.blogPromptMs, 0) / rs.length / 60000).toFixed(1), honest: rs.map(r => r.honesty?.level?.[0] ?? "·").join(""), mins: rs.map(r => (r.metrics.time.blogPromptMs / 60000).toFixed(1)).join("/"), usds: rs.map(r => { const u = runCost(r, book).usd; return u == null ? "—" : u.toFixed(2); }).join("/") }; });
rows.sort((a, b) => a.k.split(" | ")[1].localeCompare(b.k.split(" | ")[1]) || b.med - a.med);
for (const r of rows) console.log(`${r.k.padEnd(44)} n=${String(r.n).padEnd(2)} med ${String(r.med).padEnd(5)} [${r.grades}]  $${r.usd}  ${r.min}m  honesty:${r.honest}  min[${r.mins}]  $[${r.usds}]`);
