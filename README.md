# Notes — Task Management API

A full-stack task management application with JWT authentication and role-based access control.

**Stack:** Spring Boot 3 · Spring Security · JPA/Hibernate · MySQL 8 · React 18 · Swagger/OpenAPI

---

## Quick Start

### Docker Compose (recommended)

```bash
docker-compose up --build
```

- API: http://localhost:8080
- Swagger UI: http://localhost:8080/swagger-ui/index.html
- Frontend: http://localhost:3000 (run separately, see below)

### Run Locally

**Prerequisites:** Java 17+, Maven 3.8+, MySQL 8, Node 18+

1. Create a MySQL database named `notes`
2. Export environment variables (or edit `src/main/resources/application.yaml`):

```bash
export DB_URL=jdbc:mysql://localhost:3306/notes
export DB_USERNAME=root
export DB_PASSWORD=yourpassword
export JWT_SECRET=your-256-bit-secret-key-here
export JWT_EXPIRATION=86400000
```

3. Run the backend:

```bash
mvn spring-boot:run
```

4. Run the frontend:

```bash
cd ../frontend
npm install
npm run dev     # http://localhost:3000
```

---

## API Reference

### Auth (public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register a new user |
| POST | `/api/v1/auth/login` | Login, returns JWT token |

### Tasks (Bearer token required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/tasks` | List tasks (admin sees all users' tasks) |
| GET | `/api/v1/tasks?status=PENDING` | Filter by status |
| GET | `/api/v1/tasks/{id}` | Get task by ID |
| POST | `/api/v1/tasks` | Create task |
| PUT | `/api/v1/tasks/{id}` | Update task |
| DELETE | `/api/v1/tasks/{id}` | Delete task |

### Admin (ADMIN role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/admin/users` | List all users with task counts |

**Task statuses:** `PENDING` · `IN_PROGRESS` · `COMPLETED` · `CANCELLED`

Full interactive docs at `/swagger-ui/index.html`.

---

## Roles

| Role | Capabilities |
|------|-------------|
| `USER` | Default on registration. CRUD on own tasks only. |
| `ADMIN` | CRUD on all tasks. Access to `/admin/**` endpoints. |

---

## Security

- Passwords hashed with **BCrypt**
- **Stateless JWT** — no server-side sessions; tokens signed with configurable HMAC-SHA secret
- All non-auth endpoints require a valid `Authorization: Bearer <token>` header
- Role enforcement at both the filter chain (`SecurityConfig`) and method level (`@PreAuthorize`)
- CORS restricted to `localhost:3000` by default

---

## Scalability Notes

The application is designed to scale horizontally without architectural changes:

**Stateless auth** — JWT tokens carry all session state; any instance can serve any request. Add a load balancer and spin up more replicas with no changes.

**Connection pooling** — HikariCP manages the DB connection pool. Tune `spring.datasource.hikari.maximum-pool-size` per instance for your workload.

**Caching** — Hot read paths (task lists, user lookups) are candidates for Redis `@Cacheable`. Add `spring-boot-starter-data-redis` and annotate service methods — no controller changes needed.

**Read replicas** — Route `@Transactional(readOnly = true)` queries to a MySQL read replica via Spring's `AbstractRoutingDataSource`. Writes stay on the primary.

**Message queue** — Decouple future features (email notifications, audit logs, webhooks) from the request path using RabbitMQ or Kafka without touching existing controllers.

**Microservices path** — The codebase is already structured for extraction: Auth, Tasks, and Admin are independent vertical slices. When scale warrants it, split into separate Spring Boot services behind a Spring Cloud Gateway.

**Observability** — Spring Boot Actuator exposes `/actuator/health` and `/actuator/metrics`. Wire Prometheus + Grafana for dashboards; ship logs to an ELK stack or CloudWatch via the existing SLF4J/Logback setup.
