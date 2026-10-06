---
name: script-to-video
description: >
  Use when turning a script, scene or episode into AI video: casting characters, character sheets,
  consistent world, shot selection, prompt writing, checking continuity, fixing, editing.
user-invocable: true
metadata:
  tags: [workflow, script, storyboard, continuity, seedance, shots]
  version: 0.1.0
  source: Creator handover guide
---

# Script → AI video

Think like a visual storyteller first and a prompt writer second. The prompt is how you communicate a visual decision.

```
SCRIPT → WHAT SHOULD THE AUDIENCE SEE? → CAST → BUILD THE WORLD → DECIDE THE SHOT → PROMPT → GENERATE → CHECK → FIX → EDIT
```

## Steps

1. **Read the whole story / episode.** Understand the beats.
2. **For each scene ask:** who, where, what happens, what must the audience understand, what is the key action, what to notice, tone, what must match neighbouring shots (`method/scene-understanding-questions`).
3. **Cast.** Lock face, hair, skin tone, body, costume base (`method/casting-lock-table`). Make **character sheets** (`template/character-sheet-image`).
4. **List recurring locations, vehicles, props** and keep them consistent (`method/keep-the-world-consistent`).
5. **Break into visual moments**; "if I couldn't use words, what would I show?" (`method/choosing-the-shot-by-story-need`).
6. **Make the visual, not a storyboard.** Approve the frame, then use it as the target.
7. **Write the prompt** in the practical order (`template/seedance-practical-prompt-order`). Physical language; only what matters.
8. **Generate.** 15s blocks: beginning, main action, end state (`method/15-second-block-structure`).
9. **Check** every generation (`method/continuity-check-after-every-generation`).
10. **Fix one thing** at a time (`method/fix-the-specific-problem`).
11. **Edit the story** — best takes, wide for place, close-up for reactions, details for clues (`method/edit-the-story`).

## Avoid

Prompt before understanding the scene · spectacular instead of readable · changing a face because one take looks nicer · several unrelated actions in one shot · "make it emotional" · "cinematic" without a real camera · random background people · shifting locations · fixing five problems at once (`method/common-beginner-mistakes`).

Worked sequence: `method/devgarh-sequence-shot-logic`, example prompt `full-prompt/raghav-whiskey-sequence-15s`.
