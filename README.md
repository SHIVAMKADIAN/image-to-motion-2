# Prompt Library

A file-based library for thousands of image/video prompts — art styles, camera angles and
movements, lenses, lighting, methods, templates, full prompts — plus a **composer** that
assembles fragments into a prompt shaped for a specific model, and a **skill** per model.

Zero dependencies. Needs Node 20+.

```
npm run build          # → site/library.html (open it directly in a browser)
npm run validate       # lint every entry
npm test
node src/cli.js help
```

## Layout

```
data/<category>/<slug>.md    one prompt per file  (the source of truth)
taxonomy.json                allowed categories (add one here to create a new kind of prompt)
models/<id>.json             model profiles — how the composer shapes output for that model
skills/<id>/SKILL.md         guidance for writing prompts for that model / workflow
src/                         parser, search, compose, validate, build, CLI
site/library.html            generated single-file browser UI (search, filter, copy, composer)
```

Categories: `style` · `lighting` · `color-grade` · `mood` · `composition` · `shot-size` · `camera-angle` ·
`camera-movement` · `lens` · `subject` · `character` · `environment` · `action` · `audio` · `negative` ·
`template` · `full-prompt` · `method`.

## An entry

`data/style/pixel-art-16-bit.md`

```markdown
---
title: Pixel Art 16-bit
category: style
medium: [image, video]
models: [any]
tags: [pixel, pixel-art, 16-bit, retro, game]
---
16-bit pixel art, SNES-era sprite style, rich dithered shading, 64-color palette, crisp pixel edges
```

| field | notes |
|---|---|
| `title`, `category` | required; the file must live in `data/<category>/` |
| `medium` | `image`, `video` (default `image`) |
| `models` | `any`, or model ids from `models/` — set it only when the prompt is model-specific |
| `tags` | lowercase-kebab; what people will search for |
| `negative`, `notes`, `source` | optional single-line fields |
| body | the prompt text. Templates use `{{variables}}`; `{{subject}}` is filled by the composer |

The id of an entry is its path: `style/pixel-art-16-bit`.

## Adding prompts

```bash
node src/cli.js new style "Gouache Night Market" --tags gouache,night,market --medium image,video --body "…"
node src/cli.js import my-prompts.jsonl          # bulk: one JSON object per line
node src/cli.js import my-prompts.jsonl --dry-run
npm run validate && npm run build
```

JSONL line: `{"category":"style","title":"…","body":"…","tags":["a","b"],"models":["any"],"medium":["image"]}`.
Existing ids are skipped unless `--overwrite`. This is the path for scaling to thousands: generate or
collect prompts anywhere, import, and let `validate` catch unknown categories/models, bad tags and
duplicate bodies.

## Finding and composing

```bash
node src/cli.js search pixel                       # ranked full-text search
node src/cli.js search dolly -c camera-movement -m seedance-2
node src/cli.js show camera-movement/slow-dolly-in

node src/cli.js compose -m seedance-2 -s "an elderly tea-stall owner pouring chai" \
  -u shot-size/medium-close-up -u environment/roadside-tea-stall -u camera-movement/slow-dolly-in \
  -u lighting/dawn-haze-amber -u style/photorealistic -u negative/video-continuity

node src/cli.js compose -m midjourney -s "a lighthouse on a cliff" \
  -u style/pixel-art-16-bit -u lighting/golden-hour --var ar=9:16
```

The same composer runs in the browser UI (“+ Composer” on any card). It orders fragments by the model's
`order`, joins them in that model's style, routes negatives (inline `--no`, separate field, or dropped with a
warning for models without one) and warns on model mismatches or length.

## Models and skills

| model | style | negatives | skill |
|---|---|---|---|
| `seedance-2` | sentences, physical language | inline sentences | `skills/seedance-2` |
| `higgsfield` | MCSLA sentences, ≤200 words | inline | `skills/higgsfield` |
| `midjourney` | comma phrases + `--ar --v` | `--no` | `skills/midjourney` |
| `flux` | prose phrases | none (phrase positively) | `skills/flux` |
| `sdxl` | tags | separate field | `skills/sdxl` |

Also: `skills/prompt-library` (router/authoring rules) and `skills/script-to-video` (the creator
workflow from script to edit). Skills use the same `SKILL.md` frontmatter format, so they can be dropped
into a Claude skills folder as-is.

**Add a model:** copy a file in `models/`, set `id`, `name`, `order`, `style`, `negative`, optional
`suffix`/`paramDefaults`/`maxWords`; add `skills/<id>/SKILL.md`; run `npm run validate`
(it warns if the skill is missing). The model then shows up in the CLI and UI automatically.

Model facts (parameter names, limits, versions) drift. The skills note where to verify against current docs.

## Provenance

Seeded from the creator handover guide (script → shots → Seedance prompts, continuity and fix tables) and
the Higgsfield skills (MCSLA, camera presets, one-move rule, hero-frame workflow). Entries derived from them
carry `source:`. Everything else is original seed content meant to be edited.
