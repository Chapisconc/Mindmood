---
name: mindmood-ui-standards
description: Design system and UI patterns for MindMood. Covers Glassmorphism, colors, and the AI connection status.
---

## Design System

### Colors
- **Accent (Emotion):** Vibrant gradients (e.g., #8E54E9 to #4776E6).
- **Glassmorphism:** `rgba(255, 255, 255, 0.1)` with heavy blur and 1px border.
- **Success:** Emerald green (#10B981).
- **Crisis:** Deep red (#EF4444).

### Components
- **Modals:** Must have a semi-transparent backdrop and entry animations.
- **AI Indicator:** Small dot in the top right corner.
    - 🟢 **Green:** Local/Emulator API active.
    - 🔵 **Blue:** Cloud API (Render) active.
    - ⚪ **Gray:** Offline/Connecting.

### Principles
1. **Premium Feel:** Use `shadows` and `border-radius: 20px+`.
2. **Dynamic Feedback:** Every user action should trigger a subtle animation or color shift.
3. **Clarity:** AI insights should be separated from the user text by a clear visual divider.

---
*Created by Antigravity for MindMood.*
