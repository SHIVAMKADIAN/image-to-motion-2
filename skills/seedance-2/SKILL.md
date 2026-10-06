---
name: seedance-2
description: >
  Use when writing or composing prompts for Seedance 2.0 video generation: single shots,
  15-second multi-shot blocks, dialogue, physical actions. Includes structure, timing,
  and failure fixes.
user-invocable: true
metadata:
  tags: [seedance, video, prompt, multi-shot, dialogue]
  version: 0.1.0
  profile: models/seedance-2.json
---

# Seedance 2.0

Character reference = WHO is this person. The prompt = WHAT they are doing in this scene.
Use reference images for casting/identity; describe location, action, camera, light and dialogue in the prompt.

## Prompt order (think in this order)

1. Duration / shot type  2. Location and time  3. Character + reference  4. Appearance/costume
5. Action  6. Camera movement and framing  7. Important timing or physical action  8. Lighting
9. Audio / dialogue  10. Performance  11. Visual style / realism  12. What must not happen

Library: `template/seedance-practical-prompt-order`, `template/single-character-position-prompt`.

## Rules that matter

- **Physical language.** Say what posture, expression, movement and framing are. "He looks powerful" → "sits upright, chin level, camera low, slow push-in".
- **One dominant action and one dominant camera move per shot.** Sequence extra moves with timing ("pans left 0-3s, holds, pushes in 4-8s").
- **Time-stamp multi-shot blocks:** `SHOT 1 — 0-5 seconds`. A 15s block = clear beginning, one main action, clear end state.
- **State what stays sharp or blurred** when focus matters ("keep the glass sharp, face softly out of focus").
- **Physical actions:** cause → direction → contact → final position (`template/physical-action-template`).
- **Restrictions last:** same character/location/lighting throughout; no extra characters; no cartoon look.
- **Write what the shot needs, not more.** Simple shot = short prompt; many ordered events = explicit prompt.
- Dialogue in quotes, with who speaks and when; one speaker per line.

## Fix table (change ONE thing)

| Problem | First change |
|---|---|
| Wrong face | Strengthen the identity/reference instruction |
| Wrong costume | State the costume requirement explicitly |
| Wrong action | Simplify; describe the sequence |
| Wrong camera | State start position and exact movement |
| Object moves wrong | cause → direction → contact → final position |
| Extra people/objects | Remove them; say "no extra characters" |
| Over-acting | "calm, subtle, serious" |
| Looks artificial | More natural materials, light, depth, physics |

## Compose

`node src/cli.js compose -m seedance-2 -s "..." -u shot-size/... -u camera-movement/... -u negative/video-continuity`

See also `method/continuity-check-after-every-generation`, `method/15-second-block-structure`, and the full example `full-prompt/raghav-whiskey-sequence-15s`.
