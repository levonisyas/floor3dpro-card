# Floor3D [PRO] Card  
## Your Home Digital Twin – Game Engine Backbone Edition
---
>## 🔗 Floor3D [PRO] Card (source & documentation):  
>- **<https://github.com/levonisyas/floor3dpro-card>**
>- **<https://community.home-assistant.io/t/your-home-digital-twin-interactive-floor-3d-plan-pro/>**

---
<img width="1200" height="643" alt="image" src="https://github.com/user-attachments/assets/baa83f4f-d068-4f7b-9397-1a39fd71791f" />

---
**Original concept and vision:** `floor3d-card` by **@andyHA** – with full respect and acknowledgment of the foundational work.  

🔗 **Original card (source & documentation):**  
[https://github.com/adizanni/floor3d-card](https://github.com/adizanni/floor3d-card)

> **⚠️ Important:**  
> This is **not a feature expansion** of the original project.  
> For feature requests or development inquiries, please contact the original author.
---
## Context
The original `floor3d-card` works exceptionally well and introduced a powerful idea: a true **digital twin** inside Home Assistant.  
However, as models grow large and entity counts increase, natural performance and lifecycle limits emerge — not due to poor design, but because UI‑driven architectures do not scale like engines.  
**This project focuses on scaling and stabilization, not on rewriting the core idea.**

---
## Built on a Real Game‑Engine Backbone
Shaped by professional architectural insight — not just code.  
**Not a game engine — but behaves like one.**  
This card implements a **deterministic game‑engine architecture** for both rendering and asset management.

---
## Determinism as the Primary Goal
This isn’t a performance hack — it's determinism as a foundation.
**Deterministic rendering. Deterministic assets. Isolated instances. Stable behavior.**

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
---
## Floor3D Pro: From UI Component to Game‑Engine Backbone
> 100 triggers → 1 render path → 1 scheduled frame`  
> All updates flow through a controlled render exit — no render storms, no duplicated work.
### Deterministic Engine Architecture
**Floor3D Pro shifts from UI-component thinking to a game-engine backbone.**  
Instead of allowing random render triggers from multiple sources, it introduces a **deterministic render scheduler** with a single entry point: `_requestRender()`.

### Controlled Render Flow Through a Single Gate
All inputs—Hass updates, resize events, camera movements—flow through this gate, ensuring **100 triggers → 1 render**.

### State Management and Load Separation
The engine now clearly separates its "awake" state from model loading, using explicit flags to prevent premature rendering.

### Strict Processing Chain
A strict **State → Index → Apply → Render** chain and index‑space integrity guarantee smooth, predictable behavior even with hundreds of entities.

### Performance and Stability
This deterministic backbone eliminates lag, jitter, and freezing on low‑power devices, delivering a truly responsive digital twin experience.

---
## Three.js Asset Cache: Deterministic Game‑Engine Backbone
>  Assets are loaded once and treated as immutable engine resources.  
>  Each card instance operates on its own cloned asset graph — **deterministic, isolated, and safe**.
### Game‑Engine Style Asset Loading
Floor3D Pro now treats asset loading like a real game engine: each asset loads once, every instance receives a deep clone.

### UI‑Driven Re‑Instantiation Under Control
UI-driven re-instantiation—preview panels, YAML edits, parallel cards—no longer causes duplicate fetches, parse storms, or race conditions.

### Deterministic Cache and Promise Coalescing
A strict cache key (`path + objfile (+ mtlfile)`) ensures deterministic behavior, while promise coalescing guarantees that simultaneous requests resolve into a single load.

### Isolated Instances on a Shared Backbone
Cached assets remain read‑only, and every instance gets isolated materials, geometry, textures, and transforms.

### Stable Engine Loop, Deterministic Backbone
The engine loop stays untouched (`State → Index → Apply → Render`), but the backbone becomes predictable, stable, and immune to UI chaos.



---
## Installation
### Method 1: HACS (Recommended)
1. Open **HACS** in Home Assistant.
2. Click the three dots (`⋮`) in the top‑right corner.
3. Select **"Custom repositories"**.
4. Add this repository URL:  
   `https://github.com/levonisyas/floor3dpro-card`
5. Set category: **"Dashboard"**.
6. Click **"Add"**.
7. Find **"HA Digital Twin Pro Upgrade"** in HACS and install.
8. **Restart Home Assistant.**

### Method 2: Manual Installation
1. Download `floor3dpro-card.js` from the [repository](https://github.com/levonisyas/floor3dpro-card).
2. Place the file in:  
   `/config/www/community/floor3dpro-card/`
3. Add as a Lovelace resource:

```yaml
resources:
  - url: /local/community/floor3dpro-card/floor3dpro-card.js
    type: module
```

4. Enable engine logging (optional):

```yaml
pro_log: engine
```

---

## Build Chain (`Floor3D [PRO] Card`)

### Supported / Verified Environment
- **OS:** Windows
- **Node.js:** **v16.20.2**
- **npm:** **8.19.4**

> ⚠️ **Note:** Node.js 18/20 may work but are **not officially supported** for this repository at this time.

### Locked Tool Versions (Stable Build)
These versions are confirmed to build successfully:

- **TypeScript:** **4.3.5**
- **Rollup:** **2.62.0** (2.62.x)
- **rollup‑plugin‑typescript2 (rpt2):** **0.30.0**
- **tslib:** **2.6.2** *(TS helper — resolves `tslib cannot be found` errors)*

---

*Documentation version
*Architecture: Deterministic Render Scheduler + Immutable Asset Graph*

```
