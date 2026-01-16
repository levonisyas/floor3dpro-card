# Floor3D [PRO] Card

# A new upgraded version “Pro” #

Your Home Digital Twin: aka floor3d-card by @andyHA — with respect and thanks for the original vision and work.

🔗 **Original card (usage & source):**
[https://github.com/adizanni/floor3d-card](https://github.com/adizanni/floor3d-card)

> This is **NOT a feature addition** to the original project.
> For feature requests or development, please contact the original author.
---

**Built on a real game-engine backbone, shaped by professional architectural experience — not just code.
Not a game engine — but it behaves like one.**

This card uses a **deterministic game-engine backbone** for both rendering and asset management.

**A single render scheduler guarantees: **100 triggers → 1 render path → 1 scheduled frame**.
All updates flow through one controlled render exit — no render storms, no duplicated work.

**Assets are loaded once and treated as immutable engine resources.
Each card instance operates on its own cloned asset graph — deterministic, isolated, and safe.**

**Deterministic rendering. Deterministic assets. Isolated instances. Stable behavior.**

## Fix: DOM custom element isolation added so original and Pro cards can run side by side.
---

Context
The original floor3d-card works great and introduced a powerful idea: a true digital twin inside Home Assistant.
However, when models grow large and entity counts increase, natural performance and lifecycle limits begin to appear — not because of bad design, but because UI-driven architectures don’t scale like engines.

This work focuses on scaling and stabilization, not rewriting the idea.

---
## Installation

### Method 1: HACS (Recommended)
1. Open HACS in Home Assistant
2. Click the three dots (⋮) in top right
3. Select "Custom repositories"
4. Add this repository URL: `https://github.com/levonisyas/floor3dpro-card`
5. Select category: "Dashboard"
6. Click "Add"
7. Find "HA Digital Twin Pro Upgrade" in HACS and install
8. Restart Home Assistant

### Method 2: Manual Installation
1. Download `floor3dpro-card.js` from [Page](https://github.com/levonisyas/floor3dpro-card)
2. Place file in your `/config/www/community/floor3dpro-card/` directory
3. Add as Lovelace resource:
```yaml
resources:
  - url: /local/community/floor3dpro-card/floor3dpro-card.js
    type: module
```

```yaml
pro_log: engine
```

## Build Chain (floor3d-card-pro)

### Supported / Verified Environment
* **OS:** Windows
* **Node.js:** **v16.20.2**
* **npm:** **8.19.4**
⚠️ Node 18/20 may work but are not officially supported for this repository at the moment.

### Locked Tool Versions (Stable)
These versions are known to build successfully:
* **TypeScript:** **4.3.5**
* **Rollup:** **2.62.0** (2.62.x)
* **rollup-plugin-typescript2 (rpt2):** **0.30.0**
* **tslib:** **2.6.2** *(TS helper for; `tslib cannot be found` )*


