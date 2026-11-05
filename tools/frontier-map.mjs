#!/usr/bin/env node
/**
 * Frontier map generator.
 *
 * Reads graph.json + ledger.json and renders the knowledge-graph "frontier" —
 * what's mastered, what's unlocked (the edge), and what's still locked — as:
 *   - FRONTIER.md : a Markdown dashboard with two Mermaid diagrams (rank overview
 *     + full concept DAG), rank progress, and a per-module table. Renders on
 *     GitHub and in any Mermaid-aware Markdown viewer.
 *   - stdout (with --terminal) : a colored text summary for the Claude Code terminal.
 *
 * Dependency-free. Re-run after every /grade to keep the picture current:
 *     node tools/frontier-map.mjs              # regenerate FRONTIER.md
 *     node tools/frontier-map.mjs --terminal   # print to terminal
 *     node tools/frontier-map.mjs --terminal --no-write
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const args = new Set(process.argv.slice(2));
const TERMINAL = args.has("--terminal");
const NO_WRITE = args.has("--no-write");

const graph = JSON.parse(readFileSync(join(ROOT, "graph.json"), "utf8"));
const ledger = JSON.parse(readFileSync(join(ROOT, "ledger.json"), "utf8"));

const C = graph.concepts;
const ranks = graph.ranks;
const target = ledger.settings?.target_retention ?? 0.9;
const today = new Date();

// ---- module/rank ordering (ranks are listed bronze -> grandmaster) --------
const RANK_ORDER = Object.keys(ranks);
const RANK_EMOJI = {
  bronze: "🥉", silver: "🥈", gold: "🥇", platinum: "💠",
  diamond: "💎", master: "🧠", grandmaster: "👑",
};
const moduleRank = {};
const moduleOrder = [];
for (const r of RANK_ORDER) {
  for (const m of ranks[r].modules) {
    if (!(m in moduleRank)) { moduleRank[m] = r; moduleOrder.push(m); }
  }
}
const conceptsByModule = {};
for (const m of moduleOrder) conceptsByModule[m] = [];
for (const [id, n] of Object.entries(C)) {
  (conceptsByModule[n.module] ??= []).push(id);
}

// ---- state of each concept ------------------------------------------------
function daysSince(dateStr) {
  const d = new Date(dateStr + "T00:00:00");
  return Math.max(0, (today - d) / 86400000);
}
function stateOf(id) {
  const e = ledger.concepts?.[id];
  if (e) {
    const overdue = e.last_seen && e.stability ? daysSince(e.last_seen) > e.stability : false;
    if (ledger.due_for_review?.includes(id) || overdue) return "due";
    if (e.state === "mastered") return "mastered";
    return "progress"; // learning | review
  }
  if (ledger.edge?.includes(id)) return "edge";
  // derive edge even if not listed: unlocked (all prereqs mastered) but untouched
  const prereqsMastered = C[id].prereqs.every(
    (p) => ledger.concepts?.[p]?.state === "mastered",
  );
  return prereqsMastered ? "edge" : "locked";
}
const state = Object.fromEntries(Object.keys(C).map((id) => [id, stateOf(id)]));

const STYLE = {
  mastered: { fill: "#1a7f37", stroke: "#116329", color: "#ffffff", label: "mastered" },
  progress: { fill: "#0969da", stroke: "#0a53be", color: "#ffffff", label: "in progress" },
  due:      { fill: "#cf222e", stroke: "#a40e26", color: "#ffffff", label: "due for review" },
  edge:     { fill: "#bf8700", stroke: "#9a6700", color: "#ffffff", label: "edge (unlocked)" },
  locked:   { fill: "#d0d7de", stroke: "#8c959f", color: "#24292f", label: "locked" },
};
const ORDER = ["mastered", "progress", "due", "edge", "locked"];

const counts = Object.fromEntries(ORDER.map((s) => [s, 0]));
for (const s of Object.values(state)) counts[s]++;
const total = Object.keys(C).length;

// ---- helpers --------------------------------------------------------------
const nid = (id) => "n_" + id.replace(/[^a-zA-Z0-9]/g, "_");
function bar(frac, width = 18) {
  const f = Math.round(frac * width);
  return "█".repeat(f) + "░".repeat(width - f);
}
function rankStats(r) {
  const ids = ranks[r].modules.flatMap((m) => conceptsByModule[m] ?? []);
  const mastered = ids.filter((id) => state[id] === "mastered").length;
  return { ids, mastered, total: ids.length, boss: ranks[r].boss };
}

// ===========================================================================
//  Mermaid: rank overview (module nodes, sized by completion)
// ===========================================================================
function mermaidOverview() {
  const L = ["flowchart LR"];
  const modEdges = new Set();
  for (const [id, n] of Object.entries(C)) {
    for (const p of n.prereqs) {
      const a = C[p].module, b = n.module;
      if (a !== b) modEdges.add(`${a}>>>${b}`);
    }
  }
  for (const r of RANK_ORDER) {
    L.push(`  subgraph ${nid("rk_" + r)}["${RANK_EMOJI[r] ?? ""} ${r}"]`);
    L.push(`  direction TB`);
    for (const m of ranks[r].modules) {
      const ids = conceptsByModule[m] ?? [];
      const mastered = ids.filter((id) => state[id] === "mastered").length;
      const pct = ids.length ? Math.round((mastered / ids.length) * 100) : 0;
      const cls = mastered === ids.length ? "mastered"
        : mastered === 0 ? (ids.some((id) => state[id] === "edge" || state[id] === "progress" || state[id] === "due") ? "edge" : "locked")
        : "progress";
      L.push(`    ${nid("m_" + m)}["${m}<br/>${mastered}/${ids.length} · ${pct}%"]:::${cls}`);
    }
    L.push("  end");
  }
  for (const e of modEdges) {
    const [a, b] = e.split(">>>");
    L.push(`  ${nid("m_" + a)} --> ${nid("m_" + b)}`);
  }
  for (const s of ORDER) {
    const st = STYLE[s];
    L.push(`  classDef ${s} fill:${st.fill},stroke:${st.stroke},color:${st.color},stroke-width:1px;`);
  }
  return L.join("\n");
}

// ===========================================================================
//  Mermaid: full concept DAG (prereq edges), grouped by module
// ===========================================================================
function mermaidDetailed() {
  const L = ["flowchart TD"];
  for (const m of moduleOrder) {
    L.push(`  subgraph ${nid("mod_" + m)}["${RANK_EMOJI[moduleRank[m]] ?? ""} ${m}"]`);
    for (const id of conceptsByModule[m]) {
      const boss = Object.values(ranks).some((r) => r.boss === id);
      const label = (boss ? "★ " : "") + id;
      L.push(`    ${nid(id)}["${label}"]:::${state[id]}`);
    }
    L.push("  end");
  }
  // prereq edges only (the spine); keep the picture readable
  for (const [id, n] of Object.entries(C)) {
    for (const p of n.prereqs) L.push(`  ${nid(p)} --> ${nid(id)}`);
  }
  for (const s of ORDER) {
    const st = STYLE[s];
    L.push(`  classDef ${s} fill:${st.fill},stroke:${st.stroke},color:${st.color},stroke-width:1px;`);
  }
  return L.join("\n");
}

// ===========================================================================
//  Markdown dashboard
// ===========================================================================
function markdown() {
  const stamp = today.toISOString().slice(0, 10);
  const legend = ORDER.map((s) => `\`${STYLE[s].label}\``).join(" · ");
  let md = `# Frontier map — ${graph.topic}

> Auto-generated by \`tools/frontier-map.mjs\` from \`graph.json\` + \`ledger.json\`.
> Regenerate after every \`/grade\`: \`node tools/frontier-map.mjs\`. Last built **${stamp}**.

**Rank: ${RANK_EMOJI[ledger.rank] ?? ""} ${ledger.rank}** · ${counts.mastered}/${total} concepts mastered · ${counts.edge} on the edge · ${counts.locked} locked

Legend: ${legend}

## Rank progression

| Rank | Progress | Boss concept | Boss cleared |
|------|----------|--------------|:---:|
`;
  for (const r of RANK_ORDER) {
    const s = rankStats(r);
    const pct = s.total ? s.mastered / s.total : 0;
    const bossOk = state[s.boss] === "mastered" ? "✅" : "—";
    md += `| ${RANK_EMOJI[r] ?? ""} ${r} | \`${bar(pct)}\` ${Math.round(pct * 100)}% (${s.mastered}/${s.total}) | \`${s.boss}\` | ${bossOk} |\n`;
  }

  md += `\n## Rank & module overview\n\n\`\`\`mermaid\n${mermaidOverview()}\n\`\`\`\n`;

  md += `\n## Per-module detail\n\n| Module | Rank | Mastered | Edge | Locked |\n|--------|------|:---:|:---:|:---:|\n`;
  for (const m of moduleOrder) {
    const ids = conceptsByModule[m];
    const c = (st) => ids.filter((id) => state[id] === st).length;
    md += `| ${m} | ${RANK_EMOJI[moduleRank[m]]} ${moduleRank[m]} | ${c("mastered")} | ${c("edge") + c("progress") + c("due")} | ${c("locked")} |\n`;
  }

  md += `\n## The full graph\n\n`;
  md += `★ marks a rank boss. Prerequisite edges only (the \`encompasses\` review-credit edges are omitted for legibility).\n\n`;
  md += `<details><summary>Expand the full concept DAG (${total} concepts)</summary>\n\n`;
  md += `\`\`\`mermaid\n${mermaidDetailed()}\n\`\`\`\n\n</details>\n`;

  if (ledger.edge?.length) {
    md += `\n## On the edge now\n\nUnlocked and waiting — \`/next\` picks from here:\n\n`;
    md += ledger.edge
      .map((id) => `- \`${id}\` (${C[id]?.module}, ${C[id]?.tier}, difficulty ${C[id]?.difficulty})`)
      .join("\n") + "\n";
  }
  return md;
}

// ===========================================================================
//  Terminal view
// ===========================================================================
function terminal() {
  const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
  const c = (code, s) => (useColor ? `\x1b[${code}m${s}\x1b[0m` : s);
  const SW = { mastered: 32, progress: 36, due: 31, edge: 33, locked: 90 };
  const dot = (s) => c(SW[s], "●");
  const out = [];
  out.push(c("1", `\nFrontier — ${graph.topic}`) + `   rank: ${RANK_EMOJI[ledger.rank] ?? ""} ${c("1", ledger.rank)}`);
  out.push(
    `${dot("mastered")} ${counts.mastered} mastered   ` +
    `${dot("progress")} ${counts.progress} in-progress   ` +
    `${dot("due")} ${counts.due} due   ` +
    `${dot("edge")} ${counts.edge} edge   ` +
    `${dot("locked")} ${counts.locked} locked   (of ${total})`,
  );
  out.push("");
  for (const r of RANK_ORDER) {
    const s = rankStats(r);
    const pct = s.total ? s.mastered / s.total : 0;
    const bossOk = state[s.boss] === "mastered" ? c(32, "✓ boss") : c(90, "  boss");
    const barStr = c(pct === 1 ? 32 : pct > 0 ? 36 : 90, bar(pct, 16));
    out.push(
      `  ${(RANK_EMOJI[r] ?? "").padEnd(2)} ${r.padEnd(12)} ${barStr} ${String(Math.round(pct * 100)).padStart(3)}%  ` +
      `(${s.mastered}/${s.total})  ${bossOk} ${c(90, s.boss)}`,
    );
  }
  out.push("");
  out.push(c("1", "On the edge (next up):"));
  for (const id of ledger.edge ?? []) {
    out.push(`  ${dot("edge")} ${id} ${c(90, `· ${C[id]?.module} · d${C[id]?.difficulty}`)}`);
  }
  out.push("");
  return out.join("\n");
}

// ---- run ------------------------------------------------------------------
if (!NO_WRITE) {
  writeFileSync(join(ROOT, "FRONTIER.md"), markdown());
  if (!TERMINAL) console.log("Wrote FRONTIER.md");
}
if (TERMINAL) console.log(terminal());
