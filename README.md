# Notes — Full-Stack Task Management

A full-stack task management application demonstrating production-ready backend engineering: JWT authentication, role-based access control, versioned REST APIs, and containerised deployment.

**Backend:** Spring Boot 4 · Spring Security 7 · JPA/Hibernate 7 · MySQL 8  
**Frontend:** React 18 · Vite · Axios · React Router 6  
**Tooling:** Docker · Docker Compose · Swagger/OpenAPI 3 · Lombok

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Getting Started](#getting-started)
3. [Environment Variables](#environment-variables)
4. [API Reference](#api-reference)
5. [Database Schema](#database-schema)
6. [Security Architecture](#security-architecture)
7. [Frontend](#frontend)
8. [Scalability & Deployment](#scalability--deployment)

---

## Project Structure

```
notes/
├── backend/                         # Spring Boot REST API
│   ├── src/main/java/com/minibytes/notes/
│   │   ├── controllers/             # AuthController, TaskController, AdminController
│   │   ├── services/                # Business logic (interface + impl pattern)
│   │   ├── repositories/            # Spring Data JPA repositories
│   │   ├── entities/                # User, Task (JPA entities)
│   │   ├── dto/                     # Request/Response DTOs with validation
│   │   ├── security/                # JwtAuthenticationFilter, SecurityConfig
│   │   ├── exception/               # GlobalExceptionHandler + custom exceptions
│   │   ├── enums/                   # Role (USER, ADMIN), TaskStatus
│   │   └── util/                    # JwtUtil
│   ├── src/main/resources/
│   │   └── application.yaml
│   ├── Dockerfile
│   └── pom.xml
├── frontend/                        # React SPA
│   ├── src/
│   │   ├── pages/                   # RegisterPage, LoginPage, DashboardPage
│   │   ├── components/              # ProtectedRoute
│   │   ├── context/                 # AuthContext (global JWT state)
│   │   └── api/                     # Axios instance with auto Bearer injection
│   ├── Dockerfile
│   └── nginx.conf                   # Serves SPA + proxies /api → backend
├── docker-compose.yml               # MySQL + backend + frontend, one command
├── .env.example                     # Environment variable template
└── README.md
```

---

## Getting Started

### Option 1 — Docker Compose (recommended)

All three services (MySQL, backend, frontend) start with one command.

```bash
# 1. Copy and fill in environment variables
cp .env.example .env

# 2. Start everything
docker-compose up --build
```

| Service  | URL |
|----------|-----|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8080 |
| Swagger UI | http://localhost:8080/swagger-ui/index.html |
| MySQL | localhost:3306 |

> The backend waits for MySQL to pass its health check before starting.

---

### Option 2 — Run Locally

**Prerequisites:** Java 17+, Maven 3.8+, MySQL 8, Node 18+

**Backend**

```bash
# Create the database
mysql -u root -p -e "CREATE DATABASE notes_db;"

# Set environment variables (or leave defaults — see application.yaml)
export DB_URL=jdbc:mysql://localhost:3306/notes_db
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=replace-with-min-32-char-random-string
export JWT_EXPIRATION=86400

# Run
cd backend
./mvnw spring-boot:run
```

**Frontend**

```bash
cd frontend
npm install
npm run dev      # http://localhost:3000
```

The Vite dev server proxies all `/api` requests to `http://localhost:8080`, so no CORS issue during development.

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_URL` | `jdbc:mysql://localhost:3306/notes_db` | JDBC connection string |
| `DB_USERNAME` | `app_user` | Database username |
| `DB_PASSWORD` | `password` | Database password |
| `MYSQL_ROOT_PASSWORD` | — | MySQL root password (Docker only) |
| `JWT_SECRET` | *(insecure default)* | HMAC-SHA signing key — **change in production** |
| `JWT_EXPIRATION` | `86400` | Token TTL in seconds (default 24 h) |

Copy `.env.example` to `.env` and fill in values before running with Docker Compose.

---

## API Reference

All endpoints are versioned under `/api/v1`. Interactive documentation is available at `/swagger-ui/index.html` once the backend is running.

### Authentication — public

#### POST `/api/v1/auth/register`

```json
// Request
{
  "username": "alice",
  "email": "alice@example.com",
  "password": "secret123"
}

// 201 Created
{
  "token": "eyJhbGci...",
  "id": 1,
  "username": "alice",
  "email": "alice@example.com",
  "role": "USER"
}
```

Validation rules: username 3–50 chars, valid email, password ≥ 6 chars. Returns `409 Conflict` if username or email is already taken.

#### POST `/api/v1/auth/login`

```json
// Request
{
  "username": "alice",
  "password": "secret123"
}

// 200 OK  — same AuthResponse shape as register
```

Returns `401 Unauthorized` for wrong credentials.

---

### Tasks — Bearer token required

Add `Authorization: Bearer <token>` to every request.

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/tasks` | 200 | List tasks. Admins see all; users see their own. |
| `GET` | `/api/v1/tasks?status=PENDING` | 200 | Filter by status |
| `GET` | `/api/v1/tasks/{id}` | 200 | Get one task |
| `POST` | `/api/v1/tasks` | 201 | Create task |
| `PUT` | `/api/v1/tasks/{id}` | 200 | Update task |
| `DELETE` | `/api/v1/tasks/{id}` | 204 | Delete task |

**Task statuses:** `PENDING` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

#### POST / PUT body

```json
{
  "title": "Write unit tests",
  "description": "Cover service layer",
  "status": "IN_PROGRESS"
}
```

#### Task response shape

```json
{
  "id": 7,
  "title": "Write unit tests",
  "description": "Cover service layer",
  "status": "IN_PROGRESS",
  "userId": 1,
  "username": "alice",
  "createdAt": "2026-04-21T14:30:00",
  "updatedAt": "2026-04-21T15:00:00"
}
```

Attempting to access another user's task returns `403 Forbidden`.  
Accessing a non-existent task returns `404 Not Found`.

---

### Admin — `ADMIN` role required

| Method | Endpoint | Status | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/v1/admin/users` | 200 | All users with task counts |

```json
// 200 OK
[
  { "id": 1, "username": "alice", "email": "alice@example.com", "role": "USER", "taskCount": 5 },
  { "id": 2, "username": "bob",   "email": "bob@example.com",   "role": "ADMIN", "taskCount": 2 }
]
```

Non-admin requests return `403 Forbidden`.

---

### Error Response Format

All errors follow a consistent shape:

```json
// 400 Bad Request (validation failure)
{
  "status": 400,
  "message": "Validation failed",
  "errors": {
    "title": "Title is required",
    "email": "Email should be valid"
  }
}

// 404 / 409 / 403 / 401 / 500
{
  "status": 404,
  "message": "Task not found with id: 99",
  "errors": null
}
```

---

## Database Schema

Two entities with a one-to-many relationship.

```
┌──────────────────────────┐        ┌────────────────────────────────────────┐
│ user                     │        │ task                                   │
├──────────────────────────┤        ├────────────────────────────────────────┤
│ id          BIGINT PK    │──┐     │ id           BIGINT PK                 │
│ username    VARCHAR(50)  │  │     │ title        VARCHAR                   │
│ email       VARCHAR      │  └────▶│ description  TEXT                      │
│ password    VARCHAR       │        │ status       ENUM(PENDING,IN_PROGRESS, │
│ role        ENUM(USER,   │        │              COMPLETED,CANCELLED)      │
│             ADMIN)       │        │ user_id      BIGINT FK                 │
└──────────────────────────┘        │ created_at   DATETIME                  │
                                    │ updated_at   DATETIME                  │
                                    └────────────────────────────────────────┘
```

- `username` and `email` have unique constraints enforced at both the DB and application layer
- `status` stored as a string enum — readable in MySQL and extensible
- `created_at` and `updated_at` are populated automatically by Hibernate (`@CreationTimestamp` / `@UpdateTimestamp`)
- Schema is managed by Hibernate `ddl-auto: update` (swap to Flyway/Liquibase for production migrations)

---

## Security Architecture

### JWT Authentication Flow

```
Client                          Server
  │                               │
  ├─ POST /auth/login ───────────▶│
  │                               │  1. Validate credentials
  │                               │  2. Sign JWT (HMAC-SHA, configurable expiry)
  │◀─ { token, user } ───────────┤
  │                               │
  ├─ GET /tasks                   │
  │  Authorization: Bearer <jwt> ▶│
  │                               │  3. JwtAuthenticationFilter extracts token
  │                               │  4. Validates signature + expiry
  │                               │  5. Sets SecurityContext (username + roles)
  │◀─ 200 [ tasks ] ─────────────┤
```

### Key practices

| Concern | Implementation |
|---------|---------------|
| Password storage | BCrypt (`strength=10`), never stored in plaintext |
| Token signing | HMAC-SHA256 with a configurable secret key |
| Stateless sessions | No `HttpSession`; `SessionCreationPolicy.STATELESS` |
| Role enforcement | URL-level (`SecurityConfig`) **and** method-level (`@PreAuthorize`) |
| Input validation | Jakarta Bean Validation on all DTOs; `GlobalExceptionHandler` returns structured errors |
| CORS | Restricted to `localhost:3000`; configurable for production |
| CSRF | Disabled — stateless JWT APIs do not need CSRF protection |

---

## Frontend

The React SPA connects to the backend through a single Axios instance (`src/api/axiosConfig.js`) that:

- Automatically attaches `Authorization: Bearer <token>` to every request
- Intercepts `401` responses and redirects to `/login`

### Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/register` | Public | Sign up with username, email, password. Field-level error display from API. |
| `/login` | Public | Sign in, stores token + user in `localStorage`. |
| `/dashboard` | Protected | Full task CRUD. Status filter tabs. Inline edit. Admin badge + owner labels for ADMIN role. |

### Role-aware UI

- Regular users see only their own tasks under **My Tasks**
- Admin users see all tasks under **All Tasks**, with `@username` labels on tasks they don't own
- An **ADMIN** badge appears in the header for admin accounts

---

## Scalability & Deployment

### Current deployment

The app ships as three Docker containers orchestrated with Compose:

```
[Browser] → [nginx : 3000] → serves React SPA
                           → proxies /api → [Spring Boot : 8080] → [MySQL : 3306]
```

### Horizontal scaling path

**Stateless authentication** — JWT tokens carry all session state; no sticky sessions required. Place any number of backend replicas behind a load balancer (Nginx, AWS ALB) and any instance can serve any request.

**Connection pooling** — HikariCP is already wired in. Tune `spring.datasource.hikari.maximum-pool-size` per replica to match your DB's max connections divided by replica count.

**Caching** — Task list reads are the hottest path. Add `spring-boot-starter-data-redis`, annotate `TaskServiceImpl.getTasks()` with `@Cacheable("tasks")`, and invalidate on write. Zero controller changes needed.

**Read replicas** — All read operations use `@Transactional(readOnly = true)`. Route these to a MySQL read replica via Spring's `AbstractRoutingDataSource`; writes stay on the primary. Achievable with one config class.

**Async / message queue** — Email notifications, audit logging, and webhooks can be decoupled from the request path via RabbitMQ or Kafka. The service layer's interface boundaries make this a drop-in change.

**Microservices evolution** — The codebase is already split into independent vertical slices (Auth, Tasks, Admin). When load warrants, each slice can be extracted into its own Spring Boot service behind a Spring Cloud Gateway API gateway with minimal code changes.

**Observability** — Spring Boot Actuator exposes `/actuator/health` and `/actuator/metrics` out of the box. Wire Prometheus + Grafana for dashboards; ship `logs/notes-app.log` to an ELK stack or CloudWatch via the existing SLF4J/Logback configuration.

**Kubernetes readiness** — Stateless containers + health check endpoint + environment-driven config means a `kubectl apply` of a Deployment + Service manifest is all that is needed to move from Compose to Kubernetes.
