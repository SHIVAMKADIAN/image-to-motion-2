---
name: sdxl
description: >
  Use when composing Stable Diffusion / SDXL prompts: tag-style positive prompt plus a separate
  negative prompt, optional weighting syntax depending on the UI.
user-invocable: true
metadata:
  tags: [sdxl, stable-diffusion, image, prompt, negative]
  version: 0.1.0
  profile: models/sdxl.json
---

# Stable Diffusion / SDXL

- Positive prompt: subject, medium/style, lighting, color, camera. Comma-separated tags/phrases.
- Negative prompt is a separate field; the composer returns it separately. Library: `negative/*` entries tagged `sdxl`.
- Emphasis syntax like `(phrase:1.2)` depends on the UI (A1111, ComfyUI…); check yours before relying on it.
- Checkpoint/LoRA choice dominates style — a style fragment helps but does not replace the right checkpoint.
- Keep prompts focused; very long tag lists dilute attention.

`node src/cli.js compose -m sdxl -s "a knight" -u style/dark-fantasy -u negative/anatomy-artifacts`
