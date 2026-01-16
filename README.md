# floor3d-card-pro

floor3d-card (aka Your Home Digital Twin)
by @andyHA — with respect and thanks for the original vision and work.

A new upgraded version “Pro” 
Built on a real game-engine backbone, shaped by professional architectural experience — not just code.

Context
The original floor3d-card works great and introduced a powerful idea: a true digital twin inside Home Assistant.
However, when models grow large and entity counts increase, natural performance and lifecycle limits begin to appear — not because of bad design, but because UI-driven architectures don’t scale like engines.

This work focuses on scaling and stabilization, not rewriting the idea.

---

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

## Fix: DOM custom element isolation added so original and Pro cards can run side by side.
