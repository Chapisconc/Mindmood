# Copilot Instructions — MindMood

This file helps GitHub Copilot understand how to build, run, test and work with this repository.

---

## 1. Build, Run and Test Commands

### 🧠 AI Backend (FastAPI)

Start backend:

```
cd ai_api
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

Run tests:

```
cd ai_api
python -m pytest
```

Run single test:

```
python -m pytest tests/test_file.py::test_name
```

---

### 🌐 Web App (React + Vite)

Start development server:

```
cd mindmood_web
npm install
npm run dev
```

Use package.json scripts for build, lint, or test.

---

### 📱 Mobile App (React Native / Expo)

Start mobile app:

```
cd mindmood
npm install
npx expo start
```

Environment variables required:

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
```

---

### 🧪 Tests

Testing uses **pytest**.

pytest.ini configuration:

- testpaths = tests
- python*files = test*\*.py
- python*functions = test*\*
- python_classes = Test\*

Run full test suite:

```
python -m pytest
```

Run specific tests:

```
python -m pytest tests/test_module.py::TestClass::test_method
python -m pytest tests/test_module.py::test_function
```

Useful flags:

```
-k <expression>
-q
```

---

## 2. High-Level Architecture

MindMood is an emotional wellbeing journaling platform powered by AI sentiment analysis.

### Components

**ai_api**

- FastAPI backend
- Provides sentiment analysis endpoints
- Main endpoint example: POST /analyze

**mindmood_web**

- React + Vite frontend

**mindmood**

- React Native Expo mobile application

**Supabase**

- Authentication
- Database
- Storage
- Row Level Security policies

**AI & Sentiment**

- lexicon_builder.py → builds sentiment lexicon
- sentiment_analysis_nueva.py → performs analysis
- datasets/ → training and vocabulary sources

---

## 3. Repository Conventions

### Directory Roles

```
ai_api/          → FastAPI backend
mindmood_web/    → Web frontend
mindmood/        → Mobile app
docs/sql/        → Database schema
supabase_*.sql   → migrations and policies
```

---

### Environment Variables

Mobile app requires:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
```

Backend may require additional `.env` configuration.

---

### Sentiment Analysis Rules

- Update lexicons only through `lexicon_builder.py`
- Ensure analyzer loads updated vocabulary
- Validate sentiment accuracy after changes

---

### Supabase Notes

- SQL files enable RLS and policies
- Apply schemas in Supabase SQL Editor
- Ensure authentication policies remain enabled

---

## 4. Important Files

- README.md → project overview
- pytest.ini → test discovery
- docs/sql → database structure
- sentiment_analysis_nueva.py → main AI logic
- lexicon_builder.py → lexicon generation

---

## 5. Development Guidelines for Copilot

When modifying the project:

- Always operate inside the correct subproject directory.
- Prefer existing npm scripts or python commands.
- Avoid introducing global tools unless already configured.
- Keep mobile app as primary product.
- Maintain Supabase compatibility.
- Do not break RLS policies.

---

## 6. Recommended Workflow

1. Run backend
2. Start mobile app
3. Verify Supabase connection
4. Run tests
5. Validate sentiment analysis output

---

End of Copilot Instructions.
