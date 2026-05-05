---
name: maestro-testing-patterns
description: Guidelines for creating automated UI tests for MindMood using Maestro CLI. Covers registration, login, entry creation, and theme switching.
---

## Overview
Maestro uses YAML files to describe UI flows. Each flow should be focused on a specific feature.

## Basic Flow Pattern
```yaml
appId: com.mindmood.app # Change to actual package name if different
---
- launchApp
- tapOn: "Crear Cuenta"
- inputText:
    id: "email_input" # Use testID in React Native
    text: "test@example.com"
- inputText:
    id: "password_input"
    text: "password123"
- tapOn: "Confirmar Registro"
- assertVisible: "Cuenta Creada"
```

## Tips for React Native
- Always use `testID` prop in components for reliable selection.
- Use `assertVisible` to verify UI state transitions.
- Use `swipe` for scrolling if items are off-screen.

## MindMood Specific Flows
- **Auth Flow**: Test registration followed by login.
- **Entry Flow**: Test writing a diary and verifying the AI modal appears.
- **Theme Flow**: Toggle light/dark mode and verify colors change (via screenshots).

---
*Created by Antigravity for MindMood.*
