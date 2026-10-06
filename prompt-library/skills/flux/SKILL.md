---
name: flux
description: >
  Use when composing Flux image prompts: natural-language descriptions, positive phrasing,
  no negative prompt.
user-invocable: true
metadata:
  tags: [flux, image, prompt]
  version: 0.1.0
  profile: models/flux.json
---

# Flux

- Write what you want to see in plain descriptive language; subject, setting, light, lens, style.
- There is no negative prompt. Rephrase exclusions positively: "clear blue sky" not "no clouds"; "empty street" not "no people".
  The composer drops `negative/*` entries for this model and warns.
- Be explicit about camera/lens and lighting; those fragments translate well (`lens/*`, `lighting/*`).
- Longer, concrete descriptions generally help; avoid keyword soup and weights syntax.

`node src/cli.js compose -m flux -s "an elderly fisherman" -u lens/85mm-portrait -u lighting/soft-window-light -u style/photorealistic`
