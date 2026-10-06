---
name: midjourney
description: >
  Use when composing Midjourney image prompts: subject-first comma phrases, style/lighting/camera
  fragments, and trailing parameters such as --ar, --v, --no.
user-invocable: true
metadata:
  tags: [midjourney, image, prompt, parameters]
  version: 0.1.0
  profile: models/midjourney.json
---

# Midjourney

- Subject first, then medium/style, mood, lighting, color, camera/lens, composition. Short comma-separated phrases.
- Parameters go last: `--ar 16:9` (aspect ratio), `--v 7` (model version), `--no a, b` (exclusions).
  Defaults are in `models/midjourney.json` (`paramDefaults`); override with `--var ar=9:16 --var v=7`.
- Other parameters exist (`--stylize`, `--chaos`, `--sref`, `--seed`…). Confirm names and ranges in the current Midjourney docs; they change by version.
- Use fragments from `style/*`, `lighting/*`, `lens/*`, `camera-angle/*`. Negative items from `negative/*` tagged `midjourney` become `--no`.
- Prefer specific concrete nouns to long adjective stacks. Iterate one phrase at a time.

`node src/cli.js compose -m midjourney -s "a lighthouse on a cliff" -u style/pixel-art-16-bit -u lighting/golden-hour --var ar=9:16`
