import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { parse, serialize, slugify } from '../src/parse.js';
import { search } from '../src/search.js';
import { compose, fillVars } from '../src/compose.js';
import { loadAll, ROOT } from '../src/load.js';
import { validate } from '../src/validate.js';

const lib = loadAll();
const byId = new Map(lib.entries.map((e) => [e.id, e]));
const profile = (id) => lib.models.find((m) => m.id === id);

test('parse/serialize round-trip', () => {
  const meta = { title: 'A: B', category: 'style', medium: ['image', 'video'], models: ['any'], tags: ['x', 'y'], notes: 'hello' };
  const { meta: m2, body } = parse(serialize(meta, 'line one\nline two'));
  assert.deepEqual(m2, meta);
  assert.equal(body, 'line one\nline two');
});

test('parse rejects missing frontmatter', () => {
  assert.throws(() => parse('no frontmatter'), /frontmatter/);
});

test('slugify', () => {
  assert.equal(slugify('Pixel Art 16-bit!'), 'pixel-art-16-bit');
  assert.equal(slugify('Café Noir'), 'cafe-noir');
});

test('the shipped library validates with zero errors and zero warnings', () => {
  const issues = validate(lib);
  assert.deepEqual(issues, []);
});

test('library has substantial seed content across categories', () => {
  assert.ok(lib.entries.length >= 200);
  for (const c of Object.keys(lib.taxonomy.categories)) {
    assert.ok(lib.entries.some((e) => e.category === c), `no entries in ${c}`);
  }
});

test('search ranks title matches first and ANDs tokens', () => {
  const r = search(lib.entries, 'pixel art');
  assert.ok(r.length >= 3);
  assert.ok(r[0].title.toLowerCase().includes('pixel'));
  assert.equal(search(lib.entries, 'pixel zzzznotaword').length, 0);
});

test('search filters', () => {
  assert.ok(search(lib.entries, '', { category: 'camera-movement' }).every((e) => e.category === 'camera-movement'));
  assert.ok(search(lib.entries, '', { medium: 'video' }).every((e) => e.medium.includes('video')));
  assert.ok(search(lib.entries, '', { model: 'flux' }).every((e) => e.models.includes('any') || e.models.includes('flux')));
  assert.ok(search(lib.entries, '', { tag: 'noir' }).length >= 1);
});

test('fillVars reports missing variables', () => {
  assert.deepEqual(fillVars('{{a}} and {{b}}', { a: 'x' }), { text: 'x and {{b}}', missing: ['b'] });
});

test('compose: sentence style capitalizes, orders by profile, routes negatives inline', () => {
  const r = compose({
    profile: profile('seedance-2'),
    subject: 'a tea-stall owner',
    entries: ['lighting/golden-hour', 'camera-movement/slow-dolly-in', 'negative/video-continuity'].map((i) => byId.get(i)),
  });
  const p = r.prompt;
  assert.ok(p.startsWith('A tea-stall owner.'));
  assert.ok(p.indexOf('Slow dolly') !== -1 && p.indexOf('Slow dolly') < p.indexOf('Golden hour'), 'camera before lighting');
  assert.match(p, /No extra characters\./);
  assert.deepEqual(r.warnings, []);
});

test('compose: midjourney appends params and --no', () => {
  const r = compose({
    profile: profile('midjourney'),
    subject: 'a lighthouse',
    vars: { ar: '9:16' },
    entries: ['style/pixel-art-16-bit', 'negative/text-and-watermarks'].map((i) => byId.get(i)),
  });
  assert.match(r.prompt, /^a lighthouse, 16-bit pixel art/);
  assert.match(r.prompt, / --no text, captions, logos, watermarks, signatures --ar 9:16 --v 7$/);
});

test('compose: sdxl returns a separate negative prompt', () => {
  const r = compose({ profile: profile('sdxl'), subject: 'a knight', entries: [byId.get('negative/anatomy-artifacts')] });
  assert.equal(r.prompt, 'a knight');
  assert.match(r.negative, /extra fingers/);
});

test('compose: flux drops negatives with a warning', () => {
  const r = compose({ profile: profile('flux'), subject: 'a knight', entries: [byId.get('negative/anatomy-artifacts')] });
  assert.equal(r.prompt, 'a knight');
  assert.equal(r.negative, '');
  assert.ok(r.warnings.some((w) => /no negative prompt/.test(w)));
});

test('compose: templates consume {{subject}}; methods are skipped; mismatched models warn', () => {
  const r = compose({ profile: profile('flux'), subject: 'a glass bottle', entries: [byId.get('template/product-hero-shot'), byId.get('method/realism-checklist'), byId.get('camera-movement/slow-dolly-in')] });
  assert.ok(r.prompt.startsWith('a glass bottle on a seamless'));
  assert.equal(r.prompt.match(/glass bottle/g).length, 1, 'subject not duplicated');
  assert.ok(r.warnings.some((w) => /method/.test(w)));
});

test('compose: word-count guideline warning', () => {
  const long = { id: 'x/y', category: 'subject', models: ['any'], medium: ['video'], tags: [], body: Array(250).fill('word').join(' ') };
  const r = compose({ profile: profile('higgsfield'), entries: [long] });
  assert.ok(r.warnings.some((w) => /200-word/.test(w)));
});

test('every entry id referenced in skills exists', () => {
  const skillsDir = path.join(ROOT, 'skills');
  const missing = [];
  let checked = 0;
  const cats = Object.keys(lib.taxonomy.categories).join('|');
  const re = new RegExp(`\`((?:${cats})/[a-z0-9-]+)\`|(?<=\\s)((?:${cats})/[a-z0-9-]+)(?=[\\s)\`.,]|$)`, 'g');
  for (const d of fs.readdirSync(skillsDir)) {
    const text = fs.readFileSync(path.join(skillsDir, d, 'SKILL.md'), 'utf8');
    for (const m of text.matchAll(re)) {
      const id = m[1] || m[2];
      if (/\.\.\./.test(id)) continue;
      checked++;
      if (!byId.has(id)) missing.push(`${d}: ${id}`);
    }
  }
  assert.deepEqual(missing, []);
  assert.ok(checked >= 25, `only ${checked} ids checked — regex is probably not matching`);
});

test('every model profile has a skill', () => {
  for (const m of lib.models) assert.ok(fs.existsSync(path.join(ROOT, 'skills', m.id, 'SKILL.md')), m.id);
});

test('krishna-vachan project: 21 clips, 18 sheets, intact and tagged', () => {
  const project = lib.entries.filter((e) => e.tags.includes('krishna-vachan'));
  const clips = project.filter((e) => /^vachan-clip-\d\d-/.test(e.id.split('/')[1]) && !e.tags.includes('alt-version'));
  assert.equal(clips.length, 21);
  for (const c of clips) {
    const n = c.tags.find((t) => /^clip-\d\d$/.test(t)).slice(5);
    assert.match(c.body, new RegExp(`^PART 2 — CLIP ${n}: `));
    for (const block of ['ATTACH IN THIS ORDER:', 'TIMED SHOTS:', 'FINAL STATE:']) assert.ok(c.body.includes(block), `${c.id} missing ${block}`);
  }
  assert.equal(project.filter((e) => e.tags.includes('alt-version')).length, 2);
  const sheets = project.filter((e) => e.tags.includes('character-sheet'));
  assert.equal(sheets.length, 18);
  assert.equal(sheets.filter((e) => e.tags.includes('appearance-variant')).length, 6);
  for (const s of sheets) assert.ok(/four clearly separated photographic views/.test(s.body), s.id);
});
