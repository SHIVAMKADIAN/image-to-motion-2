---
title: Final State Handoff Between Clips
category: method
medium: [video]
models: [seedance-2]
tags: [continuity, handoff, final-state, sequence, multi-clip]
notes: Chains 30-second clips into one continuous sequence.
source: vachan production prompts (generalized)
---
Every clip ends with FINAL STATE: exact positions, hands, held props, door/gate state, and the camera viewpoint of the last frame.
The next clip's OPENING AND PHYSICAL POSITIONS restates that state as its starting condition ("Immediate continuation: ...").
Say explicitly what belongs to the next clip ("gate opening belongs to Clip 14", "nobody retrieves the cloth in this clip") so the model does not resolve the cliffhanger early.
If the previous render exists, attach it as a continuity reference and say which axis it carries (world, action energy, camera feel) — it cannot continue a specific action frame by frame.
After a location or time change, say so in the opening ("a location/time change, not the same night continuing").
