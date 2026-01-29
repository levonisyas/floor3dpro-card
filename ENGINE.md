
# Floor3D Pro — Engine Technical Reference  
### *This document provides the deep technical explanation behind the deterministic engine backbone, render scheduler, asset cache, transactional editor pipeline, and Pro skill architecture. It is the detailed companion to the high‑level “Deterministic Engine Core Overview” section in README.*

---

# Floor3D Pro: Deterministic Render Scheduler, Engine Backbone and Additional PRO Features

## Context: Transition from UI Component to Game Engine Logic

The original floor3d-card successfully implemented the concept of a true digital twin within Home Assistant. However, as models grow larger and entity counts increase, performance and stability limitations begin to emerge. The problem is not poor design, but rather that **UI-driven architectures do not scale like game engines**.

This work focuses on scaling and stabilization, not rewriting the core concept.

---

## Core Problem: Randomly Triggered Render Structure

**Previous State (UI Component Logic):**
- The `render()` method could be called directly from many places
- OrbitControls changes → render
- Resize events → render
- Hass state updates → render
- zIndex changes → render

**Consequences:**
- Render storms
- Sudden CPU/GPU load spikes
- Lag and freezing sensations on weak devices
- "Moving the mouse fixes it" illusion

---

## Solution: Deterministic Render Scheduler

This is **not a classic game loop**, but a **deterministic render scheduler**.

### Single Entry Point: `_requestRender()`

From outside the system, **`render()` cannot be called directly**. All triggers pass through a single gate:

```typescript
_requestRender(reason?: string)
```

- Hass updates → `_requestRender('hass')`
- Resize events → `_requestRender('resize')`
- zIndex changes → `_requestRender('zindex')`
- Mouse/camera movements → `_requestRender('controls')`

### Two Core Locking Mechanisms

#### `rafId` – Dual Engine Protection
- Prevents multiple `requestAnimationFrame` calls from running simultaneously
- Eliminates the "dual engine" or "two parallel loops" problem at its root

#### `renderPending` – Frame Consolidation
- Regardless of how many triggers occur within the same frame, **only one render operation** executes
- **100 triggers → 1 render** guarantee

> ⚠️ **Critical Distinction:** Render can be **triggered** but may **not execute**. This allows the scheduler to manage "awake/sleep" states.

---

## Engine State Management: The Engine Awake Concept

### Problem: Model Loading ≠ Engine Ready

In the old structure, when the model loaded, the engine was assumed to be ready. However, for the engine to function, the following are required:
- Scene graph
- Camera and renderer
- Controls (OrbitControls)
- Object index (for raycasting)
- Event listeners

### Solution: Explicit State Flags

```typescript
_engineAwake = false  // Are scene, camera, renderer, controls ready?
_modelReady = false   // Is model loading complete?
_bootstrapApplied = false // Has the initial state snapshot been applied?
_pendingHass: HomeAssistant | null // States received before engine awake
```

**Golden Rule:**
- The Hass setter does not have to apply state "immediately to the scene"
- If the engine is not awake, only a "pending snapshot" is stored
- When the engine becomes awake, **once** bootstrap apply runs and render is scheduled

---

## State → Index → Apply → Render Chain

### Index Space Integrity

All runtime arrays (`_states[]`, `_position[]`, `_color[]`, `_brightness[]`) must exactly match `config.entities.length` and be perfectly aligned:

- Each index `i` must represent the same entity
- Even for non-cover entities, a `_position[i] = null` slot must exist
- No entity should be skipped, no slot should remain empty

### 0 Valid Rule

For covers, `current_position = 0` is a valid value:

```typescript
// WRONG: if (attr) → treats 0 as "false"
if (attr) { ... }

// CORRECT: Explicit null/undefined check
if (attr !== undefined && attr !== null) { ... }
```

### Bootstrap Apply Process

After the engine becomes awake:
1. Apply runs for all entities from the available hass snapshot
2. After apply completes, `requestRender()` is scheduled
3. Done once, in order, deterministically

---

## Single Engine Principle

A system component with the same name can run **only once**:

- Interval timers
- Resize observers
- Event listeners
- Schedulers

**If duplicates exist:**
- The engine is not deterministic
- Memory bloat and performance degradation are inevitable
- Lifecycle issues arise

---

## Input ≠ Render Separation

**Old Logic:** Every input → immediate render

**New Logic:**
- Input → notify engine
- Engine → evaluate state
- If needed → schedule `requestRender()`

This separation maintains the "instant response when touched" feeling, especially on weak devices, while keeping render load controlled.

---

## Result: Game-Engine Render Gate

The core of the backbone:

```
RAF id + renderPending + single scheduler
```

**Characteristics:**
- `requestAnimationFrame` serves as the single gate
- 100 triggers in the same frame → 1 render
- Render is not called directly, but scheduled
- `canRender()` only decides "can we render now?"
- zIndex/edit/hass changes do not kill the scheduler, only pause it

**This is a classic game-engine render gate.**

Thanks to this structure, floor3d-card remains deterministic, stable, and performant even with hundreds of entities and complex models. This is not a UI hack, but a true game engine backbone.


# Three.js Game-Engine Style Asset Cache

### Deterministic, Per-Instance Clone Architecture for UI-Driven 3D Scenes

## Context

In UI-driven environments (such as Home Assistant dashboards), a Three.js scene is often **recreated multiple times** for reasons outside the developer’s control:

* Edit / preview panels
* Live config updates
* YAML typing triggering re-instantiation
* Overlay editors creating parallel card instances

On desktop hardware this is often tolerable.
On constrained devices (Raspberry Pi 4, tablets, iPads), it quickly becomes unstable.

The core issue is **not rendering quality** and **not visual effects**.

The real problem is that **the engine backbone is not treated like a game engine**.

---

## The Core Problem

By default, many Three.js integrations behave like this:

* Every new instance:

  * Reloads the same `.glb` / `.obj`
  * Re-parses the same geometry
  * Rebuilds the same asset graph
* Even if another instance already loaded the *exact same asset*

This leads to:

* Duplicate network fetches
* Duplicate parse work
* Unpredictable load timing
* Non-deterministic behavior when two instances race each other

In a real game engine, **this never happens**.

---

## Game Engine Principle Applied

> **An asset is loaded once.
> Instances operate on clones.**

This work introduces a **game-engine-style Asset Cache backbone** on top of an existing Three.js engine loop — **without changing rendering logic**.

---

## What This Is (and What It Is Not)

### ✅ This IS

* A **deterministic asset cache**
* Engine-style **promise coalescing**
* Per-instance **deep cloning**
* Strict **instance isolation**
* Behavior-preserving

### ❌ This is NOT

* A visual enhancement
* A render optimization hack
* A geometry/texture sharing experiment
* A scheduler rewrite
* A refactor of engine logic

---

## Architecture Overview

### Engine Backbone (unchanged)

```
State → Index → Apply → Render
```

This chain remains **untouched**.

The Asset Cache sits **before** the engine sees any Object3D.

---

## Asset Cache Rules (Phase-0)

### Deterministic Cache Key

The cache key is **only** derived from the asset source:

* `path + objfile (+ mtlfile)`

No appearance, no entity, no zoom, no shadows.

Same key → same asset
Different key → different asset

No heuristics. No guesses.

---

### Promise Coalescing (Critical)

If two instances request the same asset **at the same time**:

* One load / parse happens
* The second instance waits
* Both receive clones

This mirrors real game engines.

---

### Cache Contents

#### Shared (read-only)

* Parsed GLTF / OBJ root (`Object3D`)
* Never mutated

#### Instance-local

* Scene graph
* Materials
* Visibility
* Colors
* Transforms
* Highlights

**Nothing from the cache is added directly to the scene.**

---

## Safe Cloning Strategy

To guarantee determinism:

* **Materials** → always cloned
* **Geometry** → cloned
* **Textures** → cloned

This intentionally favors safety over memory optimization.

(Sharing is a later phase.)

---

## Why This Matters in UI Systems

In systems like Home Assistant:

* Edit previews create real card instances
* YAML typing can re-instantiate cards per keystroke
* Multiple instances may exist simultaneously

You cannot “fix” this behavior.

Instead:

> **The engine must absorb it deterministically.**

This Asset Cache ensures:

* No duplicate loads
* No race conditions
* No cross-instance contamination

---

## Engine Logging (Proof-Driven)

To verify correctness, engine-level logs were added:

```
assetCache: COLD-LOAD start
assetCache: COLD-LOAD done
assetCache: HIT (ready)
assetCache: WAIT (inflight)
assetCache: clone-start
assetCache: clone-done
```

This makes behavior **observable and provable**, not speculative.

---

## Results

* The same asset is loaded **exactly once**
* Edit preview instances never re-load assets
* Instances remain fully isolated
* Engine behavior remains unchanged
* Determinism is restored

Performance gains are a **side effect**, not the goal.

---

## Key Takeaway

> **This is not about making Three.js faster.
> It is about making it deterministic.**

When a Three.js scene is treated like a **game engine**,
UI chaos stops being a problem.

---

## Final Statement

This work establishes a **Phase-0 engine backbone**:

* No refactors
* No behavior changes
* No premature optimizations

Just one rule:

> **Load once. Clone per instance. Always.**

Everything else builds cleanly on top of that.

---

# Floor3D Pro: Transactional Editor Backbone and Deterministic Edit Pipeline

## Context: Transition from UI‑Driven Editing to Engine‑Grade Editing Logic

The original floor3d-card introduced a powerful idea: a true digital twin inside Home Assistant.  
But as configurations grow, entity counts increase, and editing becomes more complex, UI‑driven editing begins to show its limits.  
The issue is not design quality — it is simply that **UI‑driven editors do not scale like game engines**.

This work focuses on stabilization and determinism, not rewriting the concept.

---

## Core Problem: Uncontrolled Edit‑Time Rebuilds

**Previous State (UI Component Editing Logic):**
- Typing could trigger preview rebuilds  
- Selection changes could trigger rebuilds  
- Entity edits could trigger rebuilds  
- Structural changes could trigger rebuilds  

**Consequences:**
- Random preview recreation  
- Heavy rebuilds during typing  
- Lag and jitter in the editor  
- “F5‑style refresh storms”  
- Unpredictable editing experience  

---

## Solution: Deterministic Transactional Editor

This is **not a classic game loop**, but a **deterministic edit pipeline**.

### Single Commit Gate: `_commitConfig()`

From outside the system, **no heavy operation can run directly**.  
All edit‑time triggers pass through a single transactional gate:

- Typing → draft  
- Selection changes → draft  
- Entity operations → draft  
- Structural edits → draft  

Only the commit gate decides when the editor transitions from draft to applied state.

---

## Draft → Commit → Apply Chain

### Draft Layer  
All micro‑changes accumulate here:

- `_valueChanged` = draft  
- typing = draft  
- pre‑selection = draft  

Nothing rebuilds.  
Nothing applies to the preview.  
This is pure editor‑state mutation.

### Commit Gate  
A single, deterministic transition:

- `_commitConfig()` = transaction gate  
- debounce = batch  
- one `config-changed` = one deterministic apply  

This is the exact analogue of:

**“Commit point into the scene graph.”**

### Apply Layer  
Heavy operations — such as preview card recreation — run **only** here, and **only** once per commit.

---

## Game‑Engine Perspective: One‑to‑One Mapping

A real game engine separates editing from committing.  
Floor3D Pro now mirrors that architecture.

### **1️⃣ Editor State (Draft)**  
In a game engine:

- sliders move  
- entities shift  
- parameters change  
- the scene does *not* rebuild  

Only the editor state mutates.

**Our equivalent:**  
- `_valueChanged`  
- typing  
- selection pre‑state  

All remain in the draft layer.

---

### **2️⃣ Commit / Transaction Gate**  
In a game engine:

- the user finishes an action  
- the engine accepts it  
- everything passes through one gate  

**Our equivalent:**  
- `_commitConfig()`  
- batched updates  
- one deterministic apply  

This is the structural backbone of the editor.

---

### **3️⃣ Heavy Rebuild Only at Intentional Points**  
A game engine never rebuilds the scene on every mouse move.  
It rebuilds only at commit/apply.

**Our equivalent:**  
- preview recreation = heavy rebuild  
- removed from typing  
- removed from micro‑changes  
- removed from spam  

It now happens **only** when the commit gate is crossed.

---

## Why This Qualifies as an Engine Backbone

Because this work is not about:

❌ speeding up a line of code  
❌ optimizing a loop  
❌ making rendering prettier  

It is about establishing the three pillars every engine requires:

- **Time separation**  
- **State separation**  
- **Authority separation**  

Without these:

- there is no engine  
- there is no editor  
- there is no stability  

This is why the structure qualifies as a backbone.

---

## Technical Name of the Backbone

**Transactional Editor Backbone**  
or in game‑engine terminology:

**Editor → Scene Commit Pipeline**

And in your own words:

**“We aligned the Edit Card flow to the backbone.  
We did not bend the backbone to the Edit Card.”**

---

>## Deterministic Correction: (Fix)  
>*Repairs the original behavior through a clean, deterministic game‑engine backbone..*

* **Overlay is display‑only** — must not block clicks on level/zoom controls  
* **Touchstart listener marked passive** — prevents scroll‑blocking violations  
* **Canvas obscurity logic corrected** — animation stops only when a real dialog/overlay is present, not when root containers appear  
* **Edit-Card preview guard added** — unsafe DOM traversal no longer crashes the card  
* **Raycasting concat pressure eliminated** — deterministic rebuild without array growth  
* **Cover/Index alignment restored** — _states and _position now map deterministically, including valid 0 positions  
* **Editor lifecycle guard added** — early render() calls no longer risk undefined-access crashes  
* **Edit‑Card fallback template enabled** — hostile lifecycle states no longer break the editor  
* **DOM custom‑element isolation added** — original and Pro cards can run side‑by‑side without conflict.
* **Layout‑timing gap stabilized** — model_loaded events could fire while the parent size was still 0×0; rendering is now deferred until valid layout dimensions exist, preventing first‑frame stretch and aspect‑ratio artifacts

---

## Additional Pro Features

`Release` *1.5.3-Pro.Faz.1*

**Activation** *(All Pro features are **opt-in** and disabled by default.)*

### Engine Diagnostics (optional)

```yaml
Pro_log: engine
```

---

### Feature Skills (optional)

```yaml
Pro_skill: [level, editor, mobile]
```

Enables selected Pro skill modules.

* `level` → Pro Skill: `level`  
* `editor` → Pro Skill: `editor`  
* `mobile` → Pro Skill: `mobile`  

You can enable one or multiple skills:

```yaml
Pro_skill: level
```

or

```yaml
Pro_skill: [level, editor]
```

To disable all skills (default):

```yaml
Pro_skill: []
```

---

### `pro_log?: 'engine' | 'all'`**
Optional detailed logging for debugging engine behavior.
Allows tracing render scheduling, level activation, and lifecycle decisions without polluting normal logs.

---

### Level-Based Entity Filtering (Engine-Level Optimization) Mode (PRO)

Only visible and relevant levels are active.

Example:
If levels **0 → 1 → 2 → 3** are visible, only **-1 and 3** are active.
(-1 means = 7/24 active exteriors, covers, alarm, etc.)
All other levels (**0, 1, 2**) are fully dormant:

* no state updates processed
* no render / update logic executed
* no click, double-click, long-press, or gesture handling

This dramatically reduces unnecessary workload in large multi-floor models.

---

## Level-Based Entity Filtering

### Added: Level-Based Entity Filtering (Pro Skill: `level`)

This release introduces **Level-Based Entity Filtering**, a performance-oriented execution filter designed for complex multi-level 3D models with a high number of entities.

Each entity may define a numeric `level` in YAML configuration:

* `-1` → Exterior entities (always active)
* `0, 1, 2, 3, ...` → Interior levels

Level `-1` is intended for entities that must remain active **24/7**, regardless of which floor is currently visible.
Typical examples include alarms, security sensors, heating systems, climate control, exterior lighting, and other critical infrastructure that should always be monitored and responsive.
These entities bypass level filtering entirely and are never put into a sleeping state.

The card already supports visual level visibility via level buttons.
This feature **does not change visual behavior**.

Instead, it introduces an **execution rule**:

> **Active entities = level `-1` + highest currently visible level**

All other entities are considered **inactive**:

* Their Home Assistant state updates are skipped
* They are excluded from render/update cycles
* Click, double-click, and long-press actions are ignored
* No services are called for inactive entities

The highest visible level is deterministically derived from the internal `_displaylevels[]` state.

### Activation

This feature is **opt-in** and disabled by default.

Enable via:

```yaml
pro_skill: level
```

**Usage**  

```yaml
# Always-active entity (security, exterior, climate, etc.)
- entity: <your_entity>
  object_id: <your_object_id>
  level: -1   # always active, never paused

# Floor-specific entity (active only when this floor is visible)
- entity: <your_entity>
  object_id: <your_object_id>
  level: 3    # active only when floor 3 is the highest visible level
```

When enabled:

* Level-Based Entity Filtering is active
* Level-related diagnostic logging is enabled (non-spam, reason-based)

When omitted:

* Card behavior remains **100% identical** to previous versions

### Logging

When `pro_skill: level` is enabled:

* A single log line is emitted when the active rule changes:

  ```
  Active rule: level -1 + highestVisible=3 | active=40/200
  ```
* If a user interacts with an inactive entity, the action is silently blocked and logged (rate-limited):

  ```
  pro.[LEVEL] Click blocked: entityLevel=1, highestVisible=3, object=KitchenLamp
  ```

Normal entity state changes (on/off, brightness, color, etc.) produce **no additional logs**.

### Design Notes

* The filtering logic runs primarily in the `set hass()` update cycle for maximum performance impact
* Click filtering is applied only at the action execution layer to avoid breaking editor or selection behavior
* The core rendering engine and lifecycle (R.0 omurga) remain untouched
* Behavior is deterministic and side-effect free

---
### EDITOR‑User Driven Cycle Pro Skill: `editor`  
Release: `1.5.3‑Pro.Faz.1.B`

---

This skill introduces a deterministic **manual‑commit editing model** for complex 3D setups where automatic commits cause instability or preview resets.  
It changes **how** edits are committed — not **what** can be edited.  
**This feature is designed specifically for the Home Assistant visual editor UI; its benefits and behavioral differences are visible only during interactive editing, not in YAML usage.**

When enabled:

- Automatic `config-changed` commits are disabled  
- All editing actions remain fully interactive  
- Editor updates stay local  
- No debounce, no background commits, no preview‑triggered commits, no commit‑spam

Editing becomes **free**, but applying changes becomes **intentional**.

A dedicated **SAVE/Commit Changes** button appears.  
This is the **only** allowed path for configuration updates.

<span style="color:red">To apply your changes, press the **Commit Changes** button.</span>

- One click → one deterministic commit  
- No alternative commit routes  
- No auto‑commit, no lifecycle commits, no preview commits  

This enforces a clean **draft → commit → apply** pipeline.

Why this exists:

- Prevents preview rebuild storms  
- Prevents model reload loops  
- Prevents editor flicker or resets  
- Prevents incomplete configs being sent to HA  
- Keeps editing responsive on weak devices  

With this skill, configuration is committed **once**, intentionally.

**Activation** *(This feature is **opt-in** and disabled by default.)*

```yaml
Pro_skill: editor
```

Design principle:

**Editor input is free. Commit is intentional.**

What it disables:

- Navigation‑triggered commits  
- Focus/scroll commits  
- Preview lifecycle commits  
- “New card” creation commits  
- Any implicit `config-changed` spam  

All changes remain local until manually committed.

In plain terms:

**Prevents the editor from “saving on every move”.**

If previews break, cards re‑create themselves, or edits apply before you finish — this skill fixes exactly that.

---

### Mobile-Optimized Runtime Profile Pro Skill: `mobile`  
Release: `1.5.3‑Pro.Faz.1.C`

---

The **Mobile** skill enables a dedicated renderer Profile optimized for tablets and phones.  
Its purpose is to keep Floor3D stable on low‑power devices such as:

- iPad / iPhone  
- Android tablets  
- Raspberry Pi 4 (2 GB RAM)  
- Embedded dashboards and lightweight browsers  

This is **not** a UI redesign.  
It is a deterministic **render‑cost tier** that imProves:

- Smoothness  
- Responsiveness  
- Thermal / battery balance  
- Stability under heavy models  

---

Activation (Opt‑in)

Mobile mode is disabled by default.

```yaml
Pro_skill: mobile
```

When enabled:

- A mobile‑friendly performance tier becomes active  
- Desktop behavior remains unchanged when disabled  

---

Mobile Renderer Adjustments

When `Pro_skill: mobile` is active, the renderer switches into a mobile execution tier.

**1. Pixel Ratio Clamp**

High devicePixelRatio values increase GPU load on mobile hardware.  
Mobile mode enforces:

- Mobile → `pixelRatio = 1`  
- Desktop → native `window.devicePixelRatio`  

---

**2. Shadow Tier Reduction**

Shadow filtering is one of the most expensive GPU operations on mobile.  
Mobile mode reduces shadow complexity:

- Mobile → `THREE.BasicShadowMap`  
- Desktop → `THREE.PCFSoftShadowMap`  

---

**3. Antialias Tier Control**

Multisample antialiasing is costly on tablets.  
Mobile mode disables it deterministically:

- Mobile → antialias OFF  
- Desktop → antialias ON  

---

What Mobile Mode Does **Not** Change

Mobile mode does **not** modify:

- Entity mapping  
- Interaction logic  
- Editor behavior  
- UI layout  
- Any `Pro_log` features  

It is strictly a renderer‑level optimization tier.

---

Design Principle

**Mobile mode is a deterministic renderer cost Profile — not a new behavior model.**  
It allows Floor3D Pro to remain stable on weak hardware without altering the core architecture.

---
