---
name: prompt-library
description: >
  Use when the user wants to find, compose, add, or maintain prompts in this library —
  art styles, camera angles/movements, lenses, lighting, methods, templates and full
  prompts — or asks which model skill to use. Routes to the per-model skills.
user-invocable: true
metadata:
  tags: [prompt, library, router, search, compose]
  version: 0.1.0
---

# Prompt Library — router skill

Everything lives in `prompt-library/`. One prompt = one Markdown file in `data/<category>/<slug>.md`.
Never write ad-hoc prompts from memory when the library already has a fragment — search first.

## Routing

| User wants | Do |
|---|---|
| A look (pixel, Arcane, photoreal…) | `node src/cli.js search <words> -c style` |
| A camera idea | `-c camera-angle`, `-c camera-movement`, `-c shot-size`, `-c lens` |
| A finished prompt for a model | `compose` with that model (see below), then read that model's skill |
| A workflow / checklist | `-c method` (e.g. `script-to-video`, continuity, fix table) |
| Add prompts | `pl new` for one, `pl import file.jsonl` for many; then `pl validate && pl build` |
| Pick a model | read `skills/<model>/SKILL.md`; profiles live in `models/*.json` |

## Model skills

- `seedance-2` — sentence prompts, physical language, 15s multi-shot blocks (video)
- `higgsfield` — MCSLA structure, named camera presets, one-move rule (video/image)
- `midjourney` — comma phrases + parameters (image)
- `flux` — natural-language prose, no negative prompt (image)
- `sdxl` — tag prompts + separate negative prompt (image)
- `script-to-video` — the full creator workflow: script → shots → generate → check → edit

## Compose

```
node src/cli.js compose -m <model> -s "<subject>" -u <id> -u <id> ... [--var ar=9:16]
```

Fragments are ordered by the model profile (`models/<id>.json` → `order`), joined in the
model's style, negatives are routed per model (inline `--no`, separate field, or dropped with a warning).
Always read the warnings. Ids look like `style/pixel-art-16-bit`.

## Authoring rules for new entries

1. Fragment = noun/verb phrase that survives being joined with others (no leading "Create a…").
2. Describe what is visible or physically done, not feelings. "Eyes steady, jaw tight", not "he is angry".
3. One idea per entry. Put alternatives in separate entries, not "or".
4. Positive phrasing in style/lighting/etc.; exclusions go in `negative/`.
5. Tag with lowercase-kebab words people would search. Set `models:` only when it is model-specific.
6. Run `pl validate` — it catches unknown categories/models, bad tags and duplicate bodies.
