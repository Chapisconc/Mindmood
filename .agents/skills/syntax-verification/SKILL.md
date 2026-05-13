---
name: syntax-verification
description: "Automated pre/post syntax and lint verification for JS/TS/Python projects. Catches import errors, missing braces, JSX issues, and style regressions before they compound — saving tokens by avoiding debug iterations."
risk: low
source: local
date_added: "2026-05-12"
---

# Syntax Verification

> One `npx eslint .` before editing saves 10+ failed attempts after.
> **Catch errors early. Fix once. Move on.**

## When to Use

Activate this skill **before making any code change** in a project that has a linter configured. It applies to:

- Adding new files or components
- Editing existing screens/components
- Refactoring or renaming
- Fixing bugs (lint first to know the baseline)
- Any change that touches `*.js`, `*.ts`, `*.tsx`, `*.py` files

## Why This Saves Tokens

| Without skill | With skill |
|---------------|------------|
| Edit → guess → run → error → re-edit → re-run (3-5 cycles) | Run linter once → fix all issues → verify once |
| Each cycle costs ~500-2000 tokens of context re-read | One linter pass upfront avoids N-1 cycles |
| Debugging runtime errors caused by lint issues | Syntax errors caught at lint time, not runtime |

## Workflow

### Step 1: PRE-CHECK — Establish baseline

Before editing any file, run the project linter:

```bash
# JS/TS (this project)
cd mindmood && npx eslint . 2>&1
```

**Capture the output.** Note the error count. This is your baseline.

- If there are existing **errors**, those are pre-existing and should NOT increase.
- If there are existing **warnings**, note them but don't block on warnings unless they relate to your change.

### Step 2: EDIT — Make changes

Make the required code changes. Follow project conventions:
- Use `themeStyles` instead of hardcoded colors (see `nodejs-best-practices` skill)
- Match existing code style (imports, spacing, naming)

### Step 3: POST-CHECK — Verify no regressions

Run the exact same linter command again:

```bash
cd mindmood && npx eslint . 2>&1
```

**Compare with baseline:**

| Scenario | Action |
|----------|--------|
| Error count **decreased** | ✅ Success — you fixed something |
| Error count **stayed same** | ✅ Success — no regression |
| Error count **increased** | ❌ **STOP.** Do not continue. Fix the new errors first. |

If errors increased:
1. Read the new error lines (they'll appear in the diff)
2. Fix them directly
3. Re-run linter
4. Repeat until error count ≤ baseline

## Project-Specific Linter Commands

| Directory | Command |
|-----------|---------|
| `mindmood/` (React Native) | `npx eslint .` |
| `ai_api/` (Python) | `python -m pytest tests/ -v` (uses pytest for validation) |
| `root/` (configs) | `npx eslint .` |

## Common Error Patterns & Fixes

### 1. Missing imports (most common)

```
'X' is defined but never used        → Remove the import
'X' is not defined                    → Add the import
```

**Typical in this project:** Using `useRef`, `useEffect`, `useMemo`, `useCallback` without importing them from React.

**Fix:**
```js
// Before
import React, { useState } from "react";
// After
import React, { useState, useEffect, useRef, useMemo } from "react";
```

### 2. JSX unescaped entities

```
`"` can be escaped with `&quot;`, `&ldquo;`, `&#34;`, `&rdquo;`
```

**Fix:** Remove literal curly quotes from JSX text, or use `{getDynamicQuote()}` instead of wrapping in quotes.

### 3. Missing closing braces/brackets

```
Parsing error: Unexpected token
```

**Fix:** Check for unmatched `{`, `}`, `(`, `)`. The error line + 1 is usually the first line AFTER the missing token.

### 4. Hardcoded colors instead of theme (this project)

```
Found hardcoded '#FAF5FF' or '#2D1B69' in inline style
```

**Fix:** Replace with `themeStyles.background`, `themeStyles.text`, `themeStyles.card`, etc.

### 5. Hook dependency warnings

```
React Hook useEffect has a missing dependency: 'X'
```

**Fix:** Add the missing dependency to the dependency array, or remove the array entirely if intentional.

### 6. Unused variables

```
'X' is assigned a value but never used
```

**Fix:** Either use the variable or remove it from the destructuring/assignment.

## Error Recovery Protocol

If a POST-CHECK reveals NEW errors:

1. **Read the error message.** ESLint gives file, line, and column.
2. **Read the specific line.** Use the `read` tool with offset.
3. **Fix the error.** Use the patterns above.
4. **Re-run.** Repeat until clean.
5. **Do NOT commit** with new errors.

If the error is a **parsing error** (Unexpected token):
1. Likely a missing `}`, `)`, or `]`
2. Check the line before the error — the bug is usually there
3. Check for unclosed JSX tags or template literals

## Quick Reference

```bash
# Verify syntax only (no warnings noise, but harder to get — use count diff)
npx eslint . 2>&1 | Measure-Object -Line

# Get just the summary line
npx eslint . 2>&1 | Select-String "^✖"

# Count errors specifically  
npx eslint . 2>&1 | Select-String "error$" | Measure-Object | Select-Object Count

# Count warnings specifically
npx eslint . 2>&1 | Select-String "warning" | Measure-Object | Select-Object Count
```

## Limitations

- Only catches **static syntax and lint errors**. Runtime logic bugs (wrong API calls, infinite loops, incorrect business logic) require tests.
- Python linting coverage depends on what's in `pytest.ini` — this skill focuses on the ESLint workflow since that's where the project's syntax errors live.
- Warnings about hook dependencies (`exhaustive-deps`) are informational — evaluate each one rather than blindly fixing.
