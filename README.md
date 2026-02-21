# Pickleball Planner

Full-stack pickleball match tracker — Spring Boot API + React frontend, JWT-authenticated, containerised with Docker Compose.

---

## Stack

### Backend
| Layer | Technology |
|-------|-----------|
| Runtime | Java 21 (Eclipse Temurin LTS) |
| Framework | Spring Boot 3.3.6 |
| Security | Spring Security 6 + JWT (jjwt 0.12.6) |
| Persistence | Spring Data JPA + Hibernate |
| Database | PostgreSQL 16 |
| Build | Maven 3.9 |

### Frontend
| Layer | Technology |
|-------|-----------|
| UI | React 19 |
| Routing | React Router 7 |
| Styling | Tailwind CSS 4 (Vite plugin, no config file) |
| HTTP | Axios 1.13.5 (with JWT interceptor) |
| Build tool | Vite 7 |

---

## Repository Structure

```
pickleballapp/
├── backend/                             # Spring Boot API
│   ├── src/main/java/com/pickleball/app/
│   │   ├── PickleballApplication.java
│   │   ├── controller/
│   │   │   ├── AuthController.java      # POST /api/auth/register, /login
│   │   │   └── MatchController.java     # GET, POST, PUT /api/matches
│   │   ├── dto/
│   │   │   ├── SignupRequest.java
│   │   │   ├── LoginRequest.java
│   │   │   └── JwtResponse.java
│   │   ├── entity/
│   │   │   ├── Match.java
│   │   │   ├── Role.java                # enum USER | ADMIN
│   │   │   └── User.java               # implements UserDetails
│   │   ├── repository/
│   │   │   ├── MatchRepository.java
│   │   │   └── UserRepository.java
│   │   └── security/
│   │       ├── SecurityConfig.java      # FilterChain, CORS, BCrypt, @EnableMethodSecurity
│   │       ├── JwtUtils.java            # generate / validate tokens
│   │       ├── JwtFilter.java           # OncePerRequestFilter
│   │       └── UserDetailsServiceImpl.java
│   ├── Dockerfile                       # Multi-stage Maven build → JRE 21 alpine
│   ├── pom.xml
│   └── .sdkmanrc                        # Pins java 21.0.5-tem
│
├── frontend/                            # React SPA
│   ├── src/
│   │   ├── api/
│   │   │   └── axiosInstance.js         # Axios + JWT request/response interceptors
│   │   ├── pages/
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   └── MatchDashboard.jsx
│   │   ├── App.jsx                      # BrowserRouter + ProtectedRoute
│   │   ├── main.jsx
│   │   └── index.css                    # @import "tailwindcss" + @theme colors
│   ├── Dockerfile                       # Multi-stage Node build → nginx alpine
│   ├── nginx.conf                       # SPA fallback + /api proxy → app:8080
│   ├── vite.config.js                   # Tailwind plugin + /api proxy for dev
│   └── package.json
│
├── docker-compose.yml                   # db + app + frontend (all three services)
├── .gitignore
└── README.md
```

---

## Environment Variables

### Backend

| Variable            | Default                                         | Description                          |
| ------------------- | ----------------------------------------------- | ------------------------------------ |
| `DB_URL`            | `jdbc:postgresql://localhost:5432/pickleballdb` | JDBC connection URL                  |
| `DB_USER`           | `postgres`                                      | DB username                          |
| `DB_PASSWORD`       | `postgres`                                      | DB password                          |
| `JWT_SECRET`        | _(dev placeholder)_                             | HMAC-SHA256 signing key (≥ 32 chars) |
| `JWT_EXPIRATION_MS` | `86400000`                                      | Token lifetime in ms (default 24 h)  |

> **Production:** set `JWT_SECRET` to a strong random value.
> Generate one: `openssl rand -base64 32`

### Frontend

| Variable       | Default | Description                                              |
| -------------- | ------- | -------------------------------------------------------- |
| `VITE_API_URL` | _(empty)_ | API base URL. Empty = Vite proxy in dev, nginx proxy in Docker. Set to `https://api.yourdomain.com` only if serving frontend and backend from different origins. |

---

## Authentication Flow

```
POST /api/auth/register  →  BCrypt hash → save User → 201
POST /api/auth/login     →  authenticate → return JWT
GET  /api/matches        →  JwtFilter validates Bearer token → allowed
GET  /api/matches        →  no / bad token → 401
```

- All `/api/auth/**` endpoints are **public**.
- All `/api/**` endpoints require a valid JWT (`SecurityConfig` + `@PreAuthorize`).
- On login the frontend stores `token` and `email` in `localStorage`.
- The Axios interceptor reads `localStorage.token` and attaches `Authorization: Bearer <token>` to every request automatically.
- On a `401` response the interceptor clears storage and redirects to `/login`.

---

## Running Locally

### Option A — Docker Compose (all three services at once)

```bash
docker compose up --build
```

| Service    | URL                      | Notes                             |
| ---------- | ------------------------ | --------------------------------- |
| `frontend` | http://localhost         | nginx serves the React build      |
| `app`      | http://localhost:8080    | Spring Boot API (direct access)   |
| `db`       | localhost:5432 (internal)| Postgres — not exposed externally |

Startup order: **db** (health-checked) → **app** → **frontend**

```bash
docker compose down       # stop, keep DB volume
docker compose down -v    # stop + wipe DB volume
```

---

### Option B — Dev servers (hot reload)

**Terminal 1 — Backend:**

```bash
cd backend
sdk env          # activates java 21.0.5-tem via .sdkmanrc
mvn spring-boot:run
```

**Terminal 2 — Frontend:**

```bash
cd frontend
npm run dev
```

Open **http://localhost:5173**

The Vite dev server proxies all `/api/*` requests to `http://localhost:8080`, so no CORS issues and no `VITE_API_URL` needed.

---

## API Reference

### Auth (public)

#### `POST /api/auth/register`

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

| Status | Meaning              |
| ------ | -------------------- |
| `201`  | Registered           |
| `409`  | Email already in use |

#### `POST /api/auth/login`

```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

Response:
```json
{
  "token": "eyJhbGciOiJIUzI1NiJ9...",
  "email": "alice@example.com",
  "role": "USER"
}
```

---

### Matches (require JWT)

All match endpoints require the header:
```
Authorization: Bearer <token>
```

#### `GET /api/matches`
```bash
curl http://localhost:8080/api/matches \
  -H "Authorization: Bearer <token>"
```

#### `POST /api/matches`
```bash
curl -X POST http://localhost:8080/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "playerOne": "Alice",
    "playerTwo": "Bob",
    "matchDate": "2026-02-20T14:00:00"
  }'
```

#### `PUT /api/matches/{id}` — update score
```bash
curl -X PUT http://localhost:8080/api/matches/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"score": "11-9"}'
```

Returns `404` if the match ID does not exist.

---

## Frontend Pages

| Route        | Page              | Description                                      |
| ------------ | ----------------- | ------------------------------------------------ |
| `/login`     | `LoginPage`       | Email + password form, stores JWT on success     |
| `/register`  | `RegisterPage`    | Email + password form, redirects to `/login`     |
| `/dashboard` | `MatchDashboard`  | Protected — new match form + live match list     |
| `*`          | —                 | Redirects to `/login`                            |

`/dashboard` is wrapped in a `ProtectedRoute` — unauthenticated users are redirected to `/login`.

---

## Docker — Individual Builds

**Backend:**
```bash
docker build -t pickleball-app ./backend
```

**Frontend:**
```bash
docker build -t pickleball-frontend ./frontend
```

The frontend nginx container proxies `/api/` to `http://app:8080` internally, identical to the Vite dev proxy.

---

## Deploying on Coolify

### Option 1 — Docker Compose (self-contained, recommended)

1. Push this repo to GitHub / GitLab.
2. In Coolify create a **Docker Compose** service pointing at the repo.
3. Coolify runs all three services (`db`, `app`, `frontend`) from `docker-compose.yml`.
4. Set these in Coolify's **Environment Variables** UI:

| Variable      | Value                               |
| ------------- | ----------------------------------- |
| `DB_PASSWORD` | a strong password                   |
| `DB_USER`     | `postgres` (or custom)              |
| `POSTGRES_DB` | `pickleballdb`                      |
| `JWT_SECRET`  | `openssl rand -base64 32`           |

### Option 2 — Separate services (Dockerfile per service)

1. Add a **PostgreSQL** resource in Coolify; note the host and credentials.
2. Deploy `backend/` as a **Dockerfile** service. Set:

| Variable      | Value                                                    |
| ------------- | -------------------------------------------------------- |
| `DB_URL`      | `jdbc:postgresql://<coolify-db-host>:5432/pickleballdb`  |
| `DB_USER`     | your DB user                                             |
| `DB_PASSWORD` | your DB password                                         |
| `JWT_SECRET`  | `openssl rand -base64 32`                                |

3. Deploy `frontend/` as a separate **Dockerfile** service. Set:

| Variable       | Value                            |
| -------------- | -------------------------------- |
| `VITE_API_URL` | `https://your-backend-domain.com` |

> With separate deployments the nginx proxy won't reach the backend by hostname. Set `VITE_API_URL` so the frontend calls the backend directly and CORS headers handle cross-origin requests.

---

## Java Version Management

The backend pins Java 21 via `backend/.sdkmanrc`. With [SDKMAN](https://sdkman.io) installed:

```bash
cd backend
sdk env        # auto-switches to java 21.0.5-tem
```
