# Floor3D **[PRO]** Card  
## Your Home Digital Twin – Game Engine Backbone Edition  
<img width="1652" height="838" alt="image" src="https://github.com/user-attachments/assets/f6594399-1ec7-488a-ae7a-65993cb182b9" />

**Original concept and vision:** `floor3d-card` by **@andyHA** – with full respect and acknowledgment of the foundational work.  

🔗 **Original card (source & documentation):**  
[https://github.com/adizanni/floor3d-card](https://github.com/adizanni/floor3d-card)

> **⚠️ Important:**  
> This is **not a feature expansion** of the original project.  
> For feature requests or development inquiries, please contact the original author.

---

### **Built on a Real Game‑Engine Backbone**  
Shaped by professional architectural insight — not just code.  
**Not a game engine — but behaves like one.**

This card implements a **deterministic game‑engine architecture** for both rendering and asset management.

**Key architectural guarantees:**

- **Single‑path render scheduler:**  
  `100 triggers → 1 render path → 1 scheduled frame`  
  All updates flow through a controlled render exit — no render storms, no duplicated work.

- **Immutable asset lifecycle:**  
  Assets are loaded once and treated as immutable engine resources.  
  Each card instance operates on its own cloned asset graph — **deterministic, isolated, and safe**.

- **Deterministic rendering. Deterministic assets. Isolated instances. Stable behavior.**

**Fix:** DOM custom‑element isolation added — original and Pro cards can run side‑by‑side without conflict.

---

## **Context**

The original `floor3d-card` works exceptionally well and introduced a powerful idea: a true **digital twin** inside Home Assistant.  
However, as models grow large and entity counts increase, natural performance and lifecycle limits emerge — not due to poor design, but because UI‑driven architectures do not scale like engines.

**This project focuses on scaling and stabilization, not on rewriting the core idea.**

---

## **Installation**

### **Method 1: HACS (Recommended)**
1. Open **HACS** in Home Assistant.
2. Click the three dots (`⋮`) in the top‑right corner.
3. Select **"Custom repositories"**.
4. Add this repository URL:  
   `https://github.com/levonisyas/floor3dpro-card`
5. Set category: **"Dashboard"**.
6. Click **"Add"**.
7. Find **"HA Digital Twin Pro Upgrade"** in HACS and install.
8. **Restart Home Assistant.**

### **Method 2: Manual Installation**
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

## **Build Chain (`floor3d-card-pro`)**

### **Supported / Verified Environment**
- **OS:** Windows
- **Node.js:** **v16.20.2**
- **npm:** **8.19.4**

> ⚠️ **Note:** Node.js 18/20 may work but are **not officially supported** for this repository at this time.

### **Locked Tool Versions (Stable Build)**
These versions are confirmed to build successfully:

- **TypeScript:** **4.3.5**
- **Rollup:** **2.62.0** (2.62.x)
- **rollup‑plugin‑typescript2 (rpt2):** **0.30.0**
- **tslib:** **2.6.2** *(TS helper — resolves `tslib cannot be found` errors)*

---

*Documentation version: Pro Edition*  
*Architecture: Deterministic Render Scheduler + Immutable Asset Graph*

```
