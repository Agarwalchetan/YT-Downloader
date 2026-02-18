# Contributing

Thanks for your interest in this project. Since it's primarily an educational project, contributions are welcome in the form of bug fixes, improvements, and documentation updates.

---

## Development Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- FFmpeg (see [README.md](README.md#install-ffmpeg))
- Git

### 1. Fork and clone

```bash
git clone https://github.com/YOUR_USERNAME/YT-Downloader.git
cd YT-Downloader
```

### 2. Backend

```bash
# Create virtual environment
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate
# macOS / Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start the dev server (auto-reloads on file changes)
cd backend
uvicorn main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start Next.js dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## Project Conventions

### Python (backend)

- **Style**: Follow [PEP 8](https://pep8.org/). Line length limit: 100 characters.
- **Types**: Use type annotations on all function signatures.
- **Async**: All I/O-bound operations must be async or run in an executor. Never block the FastAPI event loop with synchronous yt-dlp calls.
- **Models**: All request/response shapes must be defined as Pydantic models in `models/video.py`.
- **Business logic**: Keep controllers thin — no yt-dlp or FFmpeg calls in `download_controller.py`. Put logic in `services/ytdlp_service.py`.
- **Error handling**: Raise `HTTPException` with appropriate status codes and descriptive `detail` strings from controllers.

### TypeScript (frontend)

- **Strict mode** is enabled in `tsconfig.json` — no implicit `any`.
- **Components**: All components are in `frontend/components/`, one component per file, default export.
- **State**: All application state lives in `page.tsx`. Components are purely presentational and receive everything via props.
- **API calls**: All HTTP calls go through `lib/api.ts`. Do not use `fetch` or `axios` directly in components.
- **Styling**: Use Tailwind utility classes. Custom CSS classes (`.glass`, `.btn-download`, etc.) are defined in `globals.css` and should be used for complex reusable patterns.
- **No unused imports**: Keep imports clean.

---

## Directory Responsibilities

| Directory | What goes here |
|-----------|---------------|
| `backend/controllers/` | Route definitions only — request validation, calling the service, building the response |
| `backend/models/` | Pydantic models and enums — no HTTP logic, no yt-dlp code |
| `backend/services/` | All yt-dlp and FFmpeg interaction |
| `backend/utils/` | Stateless helpers (file cleanup, etc.) |
| `frontend/components/` | Presentational React components — no direct API calls |
| `frontend/lib/` | API client and shared utilities |
| `frontend/app/` | Next.js App Router pages and layout only |

---

## Adding a New Feature

### Adding a new API endpoint

1. Add a Pydantic model for the request/response in `backend/models/video.py`
2. Add the business logic method to `backend/services/ytdlp_service.py`
3. Add the route handler to `backend/controllers/download_controller.py`
4. Add the corresponding client function to `frontend/lib/api.ts`
5. Update `API.md` with the new endpoint documentation

### Adding a new frontend component

1. Create the file in `frontend/components/YourComponent.tsx`
2. Add `'use client'` if it uses hooks or browser APIs
3. Export as default
4. Import and use it in `frontend/app/page.tsx` (or pass it as a child)
5. Props interface should be defined inline in the same file

---

## Running Type Checks

**Backend** (if you have `mypy` installed):

```bash
cd backend
mypy . --ignore-missing-imports
```

**Frontend**:

```bash
cd frontend
npx tsc --noEmit
```

---

## Dependency Updates

When updating `requirements.txt`:

```bash
pip install --upgrade yt-dlp  # Update yt-dlp specifically
pip freeze > requirements.txt  # Or pin manually
```

When updating `package.json`:

```bash
cd frontend
npm update
npm run build  # Verify the build still passes
```

---

## Commit Style

Use short, imperative commit messages:

```
fix: handle missing FFmpeg gracefully in status check
feat: add audio quality selector to QualitySelector component
docs: update API.md with new /api/status response fields
refactor: extract format parsing logic into _parse_format helper
```

Common prefixes: `feat`, `fix`, `docs`, `refactor`, `style`, `chore`

---

## Pull Request Guidelines

1. Keep PRs focused — one concern per PR
2. Update relevant documentation (README, API.md) if your change affects public-facing behavior
3. Ensure `tsc --noEmit` passes with no errors before submitting
4. Describe what the PR does and why in the PR description

---

## Questions

Open a [GitHub issue](https://github.com/Agarwalchetan/YT-Downloader/issues) for questions, bug reports, or feature ideas.
