# Project Guidelines

## Code Style

- Backend uses Spring Boot conventions with annotation-driven classes and constructor injection where applicable.
- Keep controller contracts DTO-based using existing `record` DTO patterns in `backend/src/main/java/com/pickleball/app/dto/`.
- Use `ResponseEntity` for controller responses, matching current controllers in `backend/src/main/java/com/pickleball/app/controller/`.
- Frontend uses React functional components with hooks; keep page-level components under `frontend/src/pages/`.
- Reuse the shared Axios client in `frontend/src/api/axiosInstance.js` for all API calls.

## Architecture

- Monorepo with two apps: Spring Boot API (`backend/`) and Vite React SPA (`frontend/`).
- API routes are namespaced under `/api` (see `AuthController`, `MatchController`, `UserController`).
- Persistence is PostgreSQL via Spring Data JPA/Hibernate (`backend/src/main/resources/application.properties`).
- Keep backend layering consistent with current structure: `controller` -> `repository` (+ DTO/entity/security packages).

## Build and Test

- Full stack with Docker: `docker compose up --build`
- Backend dev run: `cd backend && mvn spring-boot:run`
- Backend build: `cd backend && mvn clean package`
- Backend tests: `cd backend && mvn test`
- Frontend install/dev: `cd frontend && npm install && npm run dev`
- Frontend production build: `cd frontend && npm run build`
- Frontend preview: `cd frontend && npm run preview`

## Project Conventions

- Use relative API paths (`/api/...`) via the shared Axios instance; do not create ad-hoc fetch clients.
- Auth state is localStorage-backed (`token`, `email`) and routes expect token presence (see `frontend/src/App.jsx`).
- Maintain existing response shape expectations in UI (login currently uses `token`, `email`, `name`, `photoUrl`, `role`).
- Repository interfaces should extend `JpaRepository`; keep custom query methods minimal and explicit.

## Integration Points

- Frontend-to-backend base URL comes from `VITE_API_URL` (fallback empty) in `frontend/src/api/axiosInstance.js`.
- Local frontend dev relies on Vite proxy from `/api` to `http://localhost:8080` in `frontend/vite.config.js`.
- Containerized frontend uses Nginx `/api/` proxy to backend service (`frontend/nginx.conf`, `docker-compose.yml`).

## Security

- JWT auth is stateless: `JwtFilter` parses `Authorization: Bearer <token>` for `/api/**` routes.
- `POST /api/auth/login` issues JWT; password handling uses BCrypt in Spring Security config.
- JWT secret/expiration are configured in `backend/src/main/resources/application.properties`.
- Avoid changing auth header names, token storage keys, or `/api/auth/*` contract without updating both frontend and backend.
- If touching CORS/security config, keep parity with current frontend origins and deployment mode.
