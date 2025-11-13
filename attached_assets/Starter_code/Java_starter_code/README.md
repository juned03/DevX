# Insurance API – Java (Spring Boot) Starter

Production-ready Spring Boot starter for Insurance domain. Includes domain endpoints (Policies, Claims, Customers, Underwriting, Reports), JPA entities, repositories, Flyway baseline, tests, and Docker + Postgres.

## Tech
- Spring Boot 3 (Web, Data JPA, Validation)
- PostgreSQL + Flyway
- JUnit + MockMvc
- Docker + docker-compose

## Structure
```
Java_starter_code/
  src/main/java/com/example/insurance/
    InsuranceApiApplication.java
    domain/ (Customer, Policy, Claim)
    repository/ (CustomerRepository, PolicyRepository, ClaimRepository)
    service/ (UnderwritingService)
    controller/ (PolicyController, ClaimController, CustomerController, UnderwritingController, ReportController)
    config/DataInitializer.java
  src/main/resources/
    application.yml
    db/migration/V1__init.sql
  src/test/java/com/example/insurance/PolicyControllerTest.java
  pom.xml, Dockerfile, docker-compose.yml, .gitignore
```

## Endpoints
- GET `/api/policies`, POST `/api/policies`
- GET `/api/claims/{id}`, POST `/api/claims`
- GET `/api/customers`, POST `/api/customers`
- POST `/api/underwriting/evaluate`
- GET `/api/reports/summary`

## Local Development
```bash
# 1) Start Postgres
docker compose up -d db

# 2) Run app (with Maven)
./mvnw spring-boot:run
# or
mvn spring-boot:run
```
App on http://localhost:8080

## Docker Build
```bash
mvn -DskipTests package
docker build -t insurance-api .
docker compose up --build
```

## Environment Variables
- `DATABASE_URL` (jdbc url)
- `DB_USER`, `DB_PASSWORD`
- `PORT` (default 8080)
- `DEFAULT_ROLE` (demo only)

## 12-Factor
- Config via env in `application.yml`
- Stateless app; DB as backing service
- Dependencies managed in `pom.xml`

MIT
