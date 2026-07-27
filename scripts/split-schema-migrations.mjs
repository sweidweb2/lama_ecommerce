/**
 * Split consolidated schema.sql into ordered group migrations.
 * Usage: node scripts/split-schema-migrations.mjs
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("supabase/migrations");
const SOURCE = path.join(ROOT, "20260126141860_schema.sql");
const JOBS_SRC = path.join(ROOT, "20260714180000_jobs_and_cron.sql");

function splitSql(input) {
  const stmts = [];
  let i = 0;
  let start = 0;
  let inSingle = false;
  let inDouble = false;
  let inLineComment = false;
  let inBlockComment = false;
  let dollarTag = null;

  while (i < input.length) {
    const c = input[i];
    const next = input[i + 1];

    if (inLineComment) {
      if (c === "\n") inLineComment = false;
      i++;
      continue;
    }
    if (inBlockComment) {
      if (c === "*" && next === "/") {
        inBlockComment = false;
        i += 2;
        continue;
      }
      i++;
      continue;
    }
    if (dollarTag !== null) {
      const closer = "$" + dollarTag + "$";
      if (input.startsWith(closer, i)) {
        i += closer.length;
        dollarTag = null;
        continue;
      }
      i++;
      continue;
    }
    if (inSingle) {
      if (c === "'" && next === "'") {
        i += 2;
        continue;
      }
      if (c === "'") inSingle = false;
      i++;
      continue;
    }
    if (inDouble) {
      if (c === '"') inDouble = false;
      i++;
      continue;
    }

    if (c === "-" && next === "-") {
      inLineComment = true;
      i += 2;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlockComment = true;
      i += 2;
      continue;
    }
    if (c === "'") {
      inSingle = true;
      i++;
      continue;
    }
    if (c === '"') {
      inDouble = true;
      i++;
      continue;
    }
    if (c === "$") {
      const m = input.slice(i).match(/^\$([A-Za-z0-9_]*)\$/);
      if (m) {
        dollarTag = m[1];
        i += m[0].length;
        continue;
      }
    }
    if (c === ";") {
      const stmt = input.slice(start, i + 1).trim();
      if (stmt && stmt !== ";") stmts.push(stmt);
      start = i + 1;
    }
    i++;
  }
  const tail = input.slice(start).trim();
  if (tail) stmts.push(tail.endsWith(";") ? tail : `${tail};`);
  return stmts;
}

function stripLeadingComments(stmt) {
  return stmt.replace(/^\s*--[^\n]*\n/gm, "").trim();
}

function classify(stmt) {
  const lower = stripLeadingComments(stmt).replace(/\s+/g, " ").toLowerCase();

  if (/^create\s+extension\b/.test(lower)) return "extensions";
  if (/^create\s+type\b/.test(lower)) return "types";
  if (/^create\s+table\b/.test(lower)) return "tables";
  if (
    /^alter\s+table\b/.test(lower) &&
    /(?:enable|disable)\s+row\s+level\s+security/.test(lower)
  ) {
    return "rls_enable";
  }
  if (/^alter\s+table\b/.test(lower)) return "alters";
  if (/^create\s+(unique\s+)?index\b/.test(lower) || /^drop\s+index\b/.test(lower)) {
    return "indexes";
  }
  if (
    /^create\s+(or\s+replace\s+)?function\b/.test(lower) ||
    /^drop\s+function\b/.test(lower)
  ) {
    return "functions";
  }
  if (
    /^create\s+(constraint\s+)?trigger\b/.test(lower) ||
    /^drop\s+trigger\b/.test(lower)
  ) {
    return "triggers";
  }
  if (/^create\s+policy\b/.test(lower) || /^drop\s+policy\b/.test(lower)) {
    return "policies";
  }
  if (/^grant\b/.test(lower) || /^revoke\b/.test(lower)) return "grants";
  if (/^insert\s+into\b/.test(lower)) return "seeds";
  if (/^comment\s+on\s+function\b/.test(lower)) return "functions";
  if (/^comment\s+on\b/.test(lower)) return "comments";
  if (/^notify\b/.test(lower)) return "notify";
  if (/^do\s+\$/.test(lower)) return "do_blocks";
  if (
    /^create\s+temp\s+table\b/.test(lower) ||
    /^drop\s+table\b/.test(lower) ||
    /^update\b/.test(lower) ||
    /^delete\b/.test(lower)
  ) {
    return "data_fixups";
  }
  if (/^select\b/.test(lower)) return "selects";
  return "other";
}

/** Dependency-safe output groups (timestamp order). */
const OUTPUT_GROUPS = [
  {
    file: "20260126141860_01_types_and_tables.sql",
    title: "Types, tables, column alters, indexes, comments",
    keys: ["extensions", "types", "tables", "alters", "indexes", "comments", "data_fixups"],
  },
  {
    file: "20260126141861_02_functions.sql",
    title: "Functions (RPCs / helpers)",
    keys: ["functions"],
  },
  {
    file: "20260126141862_03_triggers.sql",
    title: "Triggers",
    keys: ["triggers"],
  },
  {
    file: "20260126141863_04_rls.sql",
    title: "Row Level Security (enable + policies)",
    keys: ["rls_enable", "policies"],
  },
  {
    file: "20260126141864_05_grants.sql",
    title: "Grants / revokes / schema reload notifies",
    keys: ["grants", "notify"],
  },
  {
    file: "20260126141865_06_seeds.sql",
    title: "Seed data",
    keys: ["seeds"],
  },
];

const KEEP = new Set([
  ...OUTPUT_GROUPS.map((g) => g.file),
  "20260714180000_jobs_and_cron.sql",
]);

function main() {
  if (!fs.existsSync(SOURCE)) {
    throw new Error(`Missing source: ${SOURCE}`);
  }
  if (!fs.existsSync(JOBS_SRC)) {
    throw new Error(`Missing jobs migration: ${JOBS_SRC}`);
  }

  const sql = fs.readFileSync(SOURCE, "utf8");
  const stmts = splitSql(sql);
  const buckets = Object.create(null);

  for (const stmt of stmts) {
    const key = classify(stmt);
    if (!buckets[key]) buckets[key] = [];
    buckets[key].push(stmt);
  }

  console.log("Statement counts:");
  for (const [k, v] of Object.entries(buckets).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  ${k}: ${v.length}`);
  }

  if (buckets.other?.length) {
    console.warn("\nUnclassified statements (will be appended to types_and_tables):");
    for (const s of buckets.other) {
      console.warn(" -", s.slice(0, 140).replace(/\s+/g, " "));
    }
    buckets.data_fixups = [...(buckets.data_fixups || []), ...buckets.other];
    delete buckets.other;
  }
  if (buckets.selects?.length) {
    // SELECT cron.schedule etc. shouldn't be in schema; ignore if any
    console.warn("Ignoring SELECT statements:", buckets.selects.length);
    delete buckets.selects;
  }
  if (buckets.do_blocks?.length) {
    // Rare; keep with tables/alters
    buckets.data_fixups = [...(buckets.data_fixups || []), ...buckets.do_blocks];
    delete buckets.do_blocks;
  }

  // Write group files
  for (const group of OUTPUT_GROUPS) {
    const parts = [];
    for (const key of group.keys) {
      const list = buckets[key];
      if (!list?.length) continue;
      parts.push(`-- ----- ${key} -----`);
      parts.push(...list);
      delete buckets[key];
    }
    const body = [
      `-- ${group.title}`,
      `-- Split from consolidated schema migration. Fresh DB reset only.`,
      "",
      ...parts,
      "",
    ].join("\n\n");
    const out = path.join(ROOT, group.file);
    fs.writeFileSync(out, body, "utf8");
    console.log(`Wrote ${group.file} (${body.length} bytes, ~${parts.filter((p) => p.endsWith(";")).length} stmts)`);
  }

  // Leftovers?
  const leftover = Object.keys(buckets);
  if (leftover.length) {
    throw new Error(`Unassigned buckets: ${leftover.join(", ")}`);
  }

  // Normalize jobs header
  const jobs = fs.readFileSync(JOBS_SRC, "utf8");
  const jobsOut = path.join(ROOT, "20260714180000_jobs_and_cron.sql");
  if (!jobs.includes("Jobs / cron")) {
    fs.writeFileSync(
      jobsOut,
      `-- Jobs / cron migration (kept separate from schema).\n-- Apply after schema group migrations.\n\n${jobs}`,
      "utf8",
    );
  }

  // Remove old monolith + any non-keep sql
  for (const name of fs.readdirSync(ROOT)) {
    if (!name.endsWith(".sql")) continue;
    if (KEEP.has(name)) continue;
    fs.unlinkSync(path.join(ROOT, name));
    console.log(`Removed ${name}`);
  }

  console.log("\nFinal migrations:");
  for (const name of fs.readdirSync(ROOT).filter((n) => n.endsWith(".sql")).sort()) {
    console.log(" -", name);
  }
}

main();
