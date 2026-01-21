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
## Additional PRO Features

**`pro_log?: 'engine' | 'level' | 'all'`**
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

