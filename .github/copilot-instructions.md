# Copilot Instructions for Christian Revain Hall

## Architecture Overview

This is a full-stack portfolio/personal project with two main components:

- **Frontend**: Vue 3 + Quasar framework (TypeScript, Vite)
- **Backend**: Django REST Framework + PostgreSQL
- **Deployment**: Docker Compose (development and production)

The frontend runs on port 8007 (dev), backend on port 8008. Client communicates with the Django API via axios.

### App Structure

**Backend (Django):**
- `server/crh/`: Main Django project settings, URL routing, and core views
- `server/api/`: API application
- Apps use Django REST Framework routers for API endpoints

**Frontend (Quasar):**
- `client/src/stores/`: Pinia store management
- `client/src/router/`: Vue Router configuration
- `client/src/pages/`: Page-level Vue components
- `client/src/layouts/`: Layout wrapper components
- `client/src/components/`: Reusable Vue components

## Build, Test, and Lint Commands

### Backend (Django/Python)

```bash
cd server

# Run development server (via Docker)
docker-compose up server

# Or directly with Django:
python manage.py runserver 0.0.0.0:8000

# Run tests
python manage.py test

# Run specific test file or app
python manage.py test app_name

# Run with pytest (if configured)
pytest

# Lint with flake8
flake8

# Format code
black .
```

**Requirements Management:**
- Dependencies are defined in `requirements.in` and `dev-requirements.in`
- Use `pip-compile` to generate locked requirements files (`.txt`)
- Process: edit `.in` file → run `pip-compile` → run `pip-sync`

### Frontend (Node/Quasar)

```bash
cd client

# Development server with hot reload
npm run dev

# Build for production
npm run build

# Lint with ESLint
npm run lint

# Auto-fix lint issues
npm run lintfix

# Format code with Prettier
npm run format
```

**Node version:** 16+ (see `package.json` engines field)

### Full Stack via Docker Compose

```bash
# Start all services (server, client, db)
docker-compose up

# Rebuild images
docker-compose build

# Stop services
docker-compose down

# View logs
docker-compose logs -f server
docker-compose logs -f client
```

**Local Dev URL:** http://127.0.0.1:8008

## Key Conventions

### Django Models

- Models use Django's built-in User model (`django.contrib.auth.models.User`)
- Query it with: `from django.contrib.auth import get_user_model; User = get_user_model()`

### API Endpoints

- Uses Django REST Framework's `DefaultRouter`
- ViewSets registered in `crh/urls.py` automatically generate CRUD endpoints

### Frontend Routing

- Routes defined in `client/src/router/routes.ts` (or similar)
- Quasar's `route()` wrapper handles SSR/SPA mode selection
- Layout system uses Quasar layouts with page nesting

### Code Style

**Backend:**
- Max line length: 99 characters (flake8 config in `setup.cfg`)
- Excluded from linting: migrations, media
- Ignores: F403 (import *), E501 (line too long), W503 (operator on newline)

**Frontend:**
- ESLint + Prettier configured
- TypeScript strict mode enabled
- Format: 2-space indentation (Prettier default)

### Testing

- Django: Use `python manage.py test` (standard Django test runner)
- Test files: `tests.py`, `*_tests.py`, `test_*.py` (see `setup.cfg`)
- Model bakery available for test fixtures
- CI runs on Python 3.8+ (see `.github/workflows/django.yml`)

### Environment & Database

- PostgreSQL via Docker (`Dockerfile-db`)
- Connection via `DATABASE_URL` env var (format: `postgres://user:pass@host/db`)
- Development: `DATABASE_URL=postgres://crhall:crhall@crh-db-net/crhall`
- Settings use `dj-database-url` to parse connection string

### Docker Setup

- Custom dockerfiles in `dockerfiles/`
- Services communicate via network aliases: `crh-server-net`, `crh-client-net`, `crh-db-net`
- Static volume shared between services (`static-volume`)
- Python packages cached in volume to avoid reinstalls

## File Locations Reference

- Settings: `server/crh/settings.py`
- URL routing: `server/crh/urls.py`
- Django management: `server/manage.py`
- Client config: `client/package.json`, `client/quasar.config.js`
- CI/CD: `.github/workflows/django.yml`
- Docker: `docker-compose.yml`, `docker-compose-prod.yml`, `dockerfiles/`
