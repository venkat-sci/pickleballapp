# Pickleball Planner Backend

Spring Boot REST API for managing pickleball matches, with JWT authentication backed by PostgreSQL.

## Stack

- Java 21 (Eclipse Temurin LTS)
- Spring Boot 3.3.6
- Spring Security 6 + JWT (jjwt 0.12.6)
- Spring Data JPA + Hibernate
- PostgreSQL 16
- Maven 3.9

## Project Structure

```
src/main/java/com/pickleball/app/
├── PickleballApplication.java
├── controller/
│   ├── AuthController.java          # POST /api/auth/register, /login
│   └── MatchController.java         # GET, POST, PUT /api/matches
├── dto/
│   ├── SignupRequest.java
│   ├── LoginRequest.java
│   └── JwtResponse.java
├── entity/
│   ├── Match.java
│   ├── Role.java                    # enum USER | ADMIN
│   └── User.java                    # implements UserDetails
├── repository/
│   ├── MatchRepository.java
│   └── UserRepository.java
└── security/
    ├── SecurityConfig.java          # SecurityFilterChain, BCrypt, AuthManager
    ├── JwtUtils.java                # generate / validate tokens
    ├── JwtFilter.java               # OncePerRequestFilter
    └── UserDetailsServiceImpl.java
```

## Environment Variables

The app reads these at startup. Defaults work for local dev without Docker.

| Variable             | Default                                         | Description                        |
| -------------------- | ----------------------------------------------- | ---------------------------------- |
| `DB_URL`             | `jdbc:postgresql://localhost:5432/pickleballdb` | JDBC connection URL                |
| `DB_USER`            | `postgres`                                      | DB username                        |
| `DB_PASSWORD`        | `postgres`                                      | DB password                        |
| `JWT_SECRET`         | _(dev placeholder — see below)_                 | HMAC-SHA256 signing key (≥ 32 chars) |
| `JWT_EXPIRATION_MS`  | `86400000`                                      | Token lifetime in ms (default 24 h) |

> **Production:** always set `JWT_SECRET` to a strong random value before deploying.
> Generate one with: `openssl rand -base64 32`

---

## Authentication Flow

```
POST /api/auth/register  →  hash password (BCrypt) → save User → 201
POST /api/auth/login     →  validate credentials   → return JWT
GET  /api/matches        →  requires Authorization: Bearer <token>
```

All `/api/auth/**` endpoints are public. All other `/api/**` endpoints require a valid JWT.

---

## Running Locally

### Option A — Docker Compose (recommended)

Starts the app and a PostgreSQL container together.

```bash
docker compose up --build
```

- First run compiles the app inside Docker (~2 min)
- Postgres starts first; app waits until DB is healthy
- App available at http://localhost:8080

```bash
docker compose down      # stop, keep DB data
docker compose down -v   # stop and delete DB volume
```

### Option B — Maven (requires local PostgreSQL)

1. Make sure PostgreSQL is running on `localhost:5432` with a database named `pickleballdb`.

2. Install Java 21 via SDKMAN (already configured in `.sdkmanrc`):

```bash
sdk env install   # installs java 21.0.5-tem if not present
sdk env           # activates the version for this project
```

3. Run:

```bash
mvn spring-boot:run
```

Override any variable inline if needed:

```bash
DB_PASSWORD=secret JWT_SECRET=my-strong-secret mvn spring-boot:run
```

---

## API Reference

### Auth endpoints (public)

#### POST /api/auth/register

Creates a new user account.

```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"secret123"}'
```

| Status | Meaning |
|--------|---------|
| `201`  | Registered successfully |
| `409`  | Email already in use |

#### POST /api/auth/login

Authenticates and returns a JWT token.

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

### Match endpoints (require JWT)

All requests below must include the header:

```
Authorization: Bearer <token>
```

#### GET /api/matches

Returns all matches.

```bash
curl http://localhost:8080/api/matches \
  -H "Authorization: Bearer <token>"
```

#### POST /api/matches

Creates a new match.

```bash
curl -X POST http://localhost:8080/api/matches \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "playerOne": "Alice",
    "playerTwo": "Bob",
    "score": "11-7",
    "matchDate": "2026-02-19T14:00:00"
  }'
```

#### PUT /api/matches/{id}

Updates the score of an existing match.

```bash
curl -X PUT http://localhost:8080/api/matches/1 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"score": "11-9"}'
```

Returns `404` if the match ID does not exist.

---

## Docker

### Build the image manually

```bash
docker build -t pickleballapp .
```

### Run with a separate Postgres container

```bash
docker network create pickleball-net

docker run -d --name db --network pickleball-net \
  -e POSTGRES_DB=pickleballdb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  postgres:16-alpine

docker run -d --name app --network pickleball-net \
  -p 8080:8080 \
  -e DB_URL=jdbc:postgresql://db:5432/pickleballdb \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  -e JWT_SECRET=my-strong-secret-key \
  pickleballapp
```

---

## Deploying on Coolify

### Option 1 — Docker Compose (self-contained)

1. Push this repo to GitHub/GitLab.
2. In Coolify, create a new **Docker Compose** service and point it at the repo.
3. Coolify will use `docker-compose.yml` to run both `app` and `db`.
4. Set secrets in Coolify's **Environment Variables** UI:

| Variable      | Value                  |
| ------------- | ---------------------- |
| `DB_PASSWORD` | a strong password      |
| `DB_USER`     | `postgres` (or custom) |
| `POSTGRES_DB` | `pickleballdb`         |
| `JWT_SECRET`  | output of `openssl rand -base64 32` |

### Option 2 — Dockerfile + Coolify-managed PostgreSQL (recommended for production)

1. Add a **PostgreSQL** resource in Coolify and note the connection details.
2. Create a new **Dockerfile** service pointing at the repo.
3. Set environment variables:

| Variable      | Value                                                   |
| ------------- | ------------------------------------------------------- |
| `DB_URL`      | `jdbc:postgresql://<coolify-db-host>:5432/pickleballdb` |
| `DB_USER`     | your DB user                                            |
| `DB_PASSWORD` | your DB password                                        |
| `JWT_SECRET`  | output of `openssl rand -base64 32`                     |

This keeps the database lifecycle independent from app deployments.

---

## Java Version Management

The project pins Java 21 via `.sdkmanrc`. With [SDKMAN](https://sdkman.io) installed:

```bash
sdk env        # auto-switches to java 21.0.5-tem when entering the project dir
```
