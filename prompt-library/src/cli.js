#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';
import { ROOT, loadAll } from './load.js';
import { validate } from './validate.js';
import { search } from './search.js';
import { compose } from './compose.js';
import { build } from './build.js';
import { serialize, slugify } from './parse.js';

const HELP = `pl — prompt library

  pl build                          build site/library.html (browser UI) + site/index.json
  pl validate                       check every entry; exit 1 on errors
  pl stats                          counts by category / model / medium
  pl models                         list model profiles
  pl search <query> [-c cat] [-m model] [--medium image|video] [-t tag] [-n 20] [--json]
  pl show <id>                      print one entry
  pl compose -m <model> [-s "subject"] -u <id> [-u <id> ...] [--var k=v] [--json]
  pl new <category> "<title>" [--tags a,b] [--models a,b] [--medium image,video] [--body "..."]
  pl import <file.jsonl> [--overwrite] [--dry-run]
                                    bulk-add entries, one JSON object per line:
                                    {"category","title","body","tags":[],"models":[],"medium":[],"negative","notes","source"}
`;

const die = (msg) => { console.error(msg); process.exit(1); };
const [cmd, ...rest] = process.argv.slice(2);
if (!cmd || cmd === 'help' || cmd === '--help' || cmd === '-h') { console.log(HELP); process.exit(0); }

const lib = loadAll();
const byId = new Map(lib.entries.map((e) => [e.id, e]));
const clip = (s, n = 90) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function printIssues(issues) {
  for (const i of issues) console.log(`${i.level === 'error' ? 'ERROR' : 'warn '} ${i.id}: ${i.msg}`);
}

const commands = {
  build() {
    const issues = validate(lib);
    if (issues.some((i) => i.level === 'error')) { printIssues(issues.filter((i) => i.level === 'error')); die('fix validation errors before building'); }
    const r = build(lib);
    console.log(`built site/library.html (${r.entries} entries, ${(r.bytes / 1024).toFixed(0)} KB)`);
  },

  validate() {
    const issues = validate(lib);
    printIssues(issues);
    const errors = issues.filter((i) => i.level === 'error').length;
    console.log(`\n${lib.entries.length} entries, ${lib.models.length} models — ${errors} error(s), ${issues.length - errors} warning(s)`);
    process.exit(errors ? 1 : 0);
  },

  stats() {
    const count = (fn) => {
      const m = new Map();
      for (const e of lib.entries) for (const k of [].concat(fn(e))) m.set(k, (m.get(k) || 0) + 1);
      return [...m].sort((a, b) => b[1] - a[1]);
    };
    console.log(`total: ${lib.entries.length}`);
    for (const [title, fn] of [['category', (e) => e.category], ['model', (e) => e.models], ['medium', (e) => e.medium]]) {
      console.log(`\nby ${title}`);
      for (const [k, n] of count(fn)) console.log(`  ${String(n).padStart(5)}  ${k}`);
    }
  },

  models() {
    for (const m of lib.models) console.log(`${m.id.padEnd(14)} ${m.medium.join('+').padEnd(12)} ${m.name}`);
  },

  search() {
    const { values, positionals } = parseArgs({
      args: rest, allowPositionals: true,
      options: { c: { type: 'string' }, m: { type: 'string' }, medium: { type: 'string' }, t: { type: 'string' }, n: { type: 'string', default: '20' }, json: { type: 'boolean' } },
    });
    const hits = search(lib.entries, positionals.join(' '), { category: values.c, model: values.m, medium: values.medium, tag: values.t });
    const shown = hits.slice(0, Number(values.n));
    if (values.json) return console.log(JSON.stringify(shown.map(({ _keys, ...e }) => e), null, 2));
    for (const e of shown) console.log(`${e.id.padEnd(44)} ${clip(e.body.replace(/\s+/g, ' '), 70)}`);
    console.log(`\n${shown.length} of ${hits.length} match(es)`);
  },

  show() {
    const e = byId.get(rest[0]);
    if (!e) die(`no entry "${rest[0]}" — try: pl search <words>`);
    console.log(`# ${e.title}  [${e.id}]\nmedium: ${e.medium.join(', ')} | models: ${e.models.join(', ')} | tags: ${e.tags.join(', ')}\n\n${e.body}`);
    if (e.negative) console.log(`\navoid: ${e.negative}`);
    if (e.notes) console.log(`\nnotes: ${e.notes}`);
  },

  compose() {
    const { values } = parseArgs({
      args: rest,
      options: { m: { type: 'string' }, s: { type: 'string', default: '' }, u: { type: 'string', multiple: true, default: [] }, var: { type: 'string', multiple: true, default: [] }, json: { type: 'boolean' } },
    });
    const profile = lib.models.find((p) => p.id === values.m);
    if (!profile) die(`unknown model "${values.m}". Available: ${lib.models.map((p) => p.id).join(', ')}`);
    const entries = values.u.map((id) => {
      const e = byId.get(id);
      if (!e) die(`no entry "${id}". Closest: ${search(lib.entries, id.replace(/[/-]/g, ' ')).slice(0, 3).map((x) => x.id).join(', ') || 'none'}`);
      return e;
    });
    const vars = Object.fromEntries(values.var.map((kv) => { const i = kv.indexOf('='); return [kv.slice(0, i), kv.slice(i + 1)]; }));
    const r = compose({ profile, entries, subject: values.s, vars });
    if (values.json) return console.log(JSON.stringify(r, null, 2));
    console.log(r.prompt);
    if (r.negative) console.log(`\nNegative prompt: ${r.negative}`);
    for (const w of r.warnings) console.error(`warn: ${w}`);
  },

  new() {
    const { values, positionals } = parseArgs({
      args: rest, allowPositionals: true,
      options: { tags: { type: 'string', default: '' }, models: { type: 'string', default: 'any' }, medium: { type: 'string', default: 'image' }, body: { type: 'string', default: 'TODO: write the prompt here' } },
    });
    const [category, ...t] = positionals;
    const title = t.join(' ');
    if (!category || !title) die('usage: pl new <category> "<title>"');
    if (!lib.taxonomy.categories[category]) die(`unknown category "${category}". One of: ${Object.keys(lib.taxonomy.categories).join(', ')}`);
    const file = writeEntry({ category, title, tags: values.tags.split(',').map((s) => s.trim()).filter(Boolean), models: values.models.split(',').map((s) => s.trim()), medium: values.medium.split(',').map((s) => s.trim()), body: values.body }, false);
    console.log(`created ${file}`);
  },

  import() {
    const { values, positionals } = parseArgs({ args: rest, allowPositionals: true, options: { overwrite: { type: 'boolean' }, 'dry-run': { type: 'boolean' } } });
    if (!positionals[0]) die('usage: pl import <file.jsonl>');
    const lines = fs.readFileSync(positionals[0], 'utf8').split(/\r?\n/).filter((l) => l.trim());
    let added = 0, skipped = 0, bad = 0;
    lines.forEach((line, n) => {
      let o;
      try { o = JSON.parse(line); } catch { bad++; console.error(`line ${n + 1}: invalid JSON`); return; }
      if (!o.category || !o.title || !o.body || !lib.taxonomy.categories[o.category]) { bad++; console.error(`line ${n + 1}: needs valid category, title, body`); return; }
      const id = `${o.category}/${slugify(o.title)}`;
      if (byId.has(id) && !values.overwrite) { skipped++; return; }
      if (!values['dry-run']) writeEntry(o, true);
      added++;
    });
    console.log(`${values['dry-run'] ? '[dry-run] ' : ''}added ${added}, skipped ${skipped} existing, ${bad} bad line(s). Run: pl validate && pl build`);
  },
};

function writeEntry(o, overwrite) {
  const dir = path.join(ROOT, 'data', o.category);
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${slugify(o.title)}.md`);
  if (fs.existsSync(file) && !overwrite) die(`${path.relative(ROOT, file)} already exists`);
  const meta = { title: o.title, category: o.category, medium: o.medium || ['image'], models: o.models || ['any'], tags: o.tags || [], negative: o.negative, notes: o.notes, source: o.source };
  fs.writeFileSync(file, serialize(meta, o.body));
  return path.relative(ROOT, file);
}

if (!commands[cmd]) die(`unknown command "${cmd}"\n\n${HELP}`);
commands[cmd]();
