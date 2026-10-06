---
name: higgsfield
description: >
  Use when writing prompts for Higgsfield (Kling, Sora 2, Veo, Wan, Seedance, Soul, Nano Banana, etc.):
  MCSLA structure, named camera presets, Soul ID consistency, hero-frame workflow, credit discipline.
user-invocable: true
metadata:
  tags: [higgsfield, video, image, mcsla, camera]
  version: 0.1.0
  profile: models/higgsfield.json
---

# Higgsfield

Higgsfield hosts many engines; model names, presets and prices change between releases.
Verify named presets and parameters on the platform before relying on them.

## MCSLA — five layers, every video prompt

**M**odel · **C**amera · **S**ubject · **L**ook · **A**ction. Keep under ~200 words
(`template/mcsla-video-prompt`). Order that works: Subject → Action → Camera → Style.

## Camera

- Use the platform's exact preset names (Dolly In, Crane Up, 360 Orbit, FPV Drone, Crash Zoom In, Whip Pan, Bullet Time…). Library: `camera-movement/*`.
- **One primary camera move per shot.** No stacked moves. Need more → separate shots (`method/one-move-camera-rule`).
- Match camera to emotion (`method/camera-matches-emotion`).
- To copy complex motion, use a video reference for camera and say so (`method/reference-video-jobs`).

## Workflow and credits

1. Perfect the still first (5-10 cheap variations → refine one).
2. Animate once from the hero frame (`method/hero-frame-first`).
3. Change one variable per re-roll.
4. Reserve premium models for hero shots; simple single-character shots rarely need them.
5. Save every prompt that works — the platform has no prompt library of its own. That is this repo's job.

## Prompt hygiene

- Prefer positive phrasing ("steady frame", "one subject") over long negation lists.
- Aspect ratio is an enum per model — check the model's allowed ratios; "anamorphic" is a look, not an output ratio.
- Identity: use an image reference / Soul ID for faces; a video reference carries world, texture, camera feel, not exact identity.

## Compose

`node src/cli.js compose -m higgsfield -s "..." -u shot-size/... -u camera-movement/... -u style/...`
