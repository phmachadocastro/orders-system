# Orders System

Technical test implementation with:

- API service: Fastify + TypeScript
- Worker service: Java + Quarkus
- Database: PostgreSQL (Docker Compose)

## Project Structure

```text
orders-system/
├── api-orders/      # Fastify API
├── orders-worker/   # Quarkus scheduled worker
├── database/        # SQL bootstrap
├── docker-compose.yml
└── .env.example
```

## Prerequisites

- Docker + Docker Compose
- Node.js 20+ and npm
- Java 21
- Maven (or use `orders-worker/mvnw`)

Optional (recommended): SDKMAN for Java/Maven version management.

## Environment Setup

From project root:

```bash
cp .env.example .env
cp api-orders/.env.example api-orders/.env
```

Then update values in `.env` and `api-orders/.env`.
Important: DB values must be the same across root and API env files.

Required variables:

- `DB_KIND`
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`
- `PORT` (API port)
- `WORKER_CONFIRM_INTERVAL` (e.g. `60s`)
- `WORKER_CONFIRM_AFTER_MINUTES` (e.g. `10`)

Runtime hardening in this repo:

- API fails fast when required DB vars or `PORT` are missing/invalid.
- Worker datasource has no sensitive runtime defaults.
- Docker Compose requires DB vars explicitly (`${VAR:?required}`).

## Run the Project (Step by Step)

### 1. Start PostgreSQL

```bash
cd /home/p/orders-system
docker compose up -d db
docker compose ps
```

Expected in `PORTS`:

```text
0.0.0.0:<DB_PORT>->5432/tcp
```

### 2. Start API (Terminal A)

```bash
cd /home/p/orders-system/api-orders
npm install
npm run dev
```

Expected log:

```text
Server running on http://localhost:<PORT>
```

### 3. Check API health (Terminal B)

If `PORT=3000`:

```bash
curl -sS http://localhost:3000/
```

Expected:

```json
{"message":"API is running 🚀"}
```

### 4. Start Worker (Terminal C)

```bash
cd /home/p/orders-system
set -a
source .env
set +a

cd /home/p/orders-system/orders-worker
./mvnw quarkus:dev -Ddebug=false
```

Expected periodic log:

```text
Worker confirmed X pending orders
```

## API Endpoints

- `GET /orders?page=1&limit=10`
- `POST /orders`
- `GET /orders/:id`
- `PATCH /orders/:id/status`

Business rule:

- A `confirmed` order cannot be changed to `cancelled` (returns `409`).

## End-to-End Test (API + DB + Worker)

In a new terminal, load root env first:

```bash
cd /home/p/orders-system
set -a
source .env
set +a
```

### 1. Create an order

```bash
CREATE_RES=$(curl -sS -X POST "http://localhost:${PORT}/orders" \
  -H "Content-Type: application/json" \
  -d '{"customer_name":"E2E Test","items":[{"product":"Cable","quantity":1,"unit_price":25}]}')

echo "$CREATE_RES"
ORDER_ID=$(echo "$CREATE_RES" | sed -n 's/.*"id":"\([^"]*\)".*/\1/p')
echo "$ORDER_ID"
```

### 2. Force order to be older than confirmation window

```bash
docker compose exec -T db psql -U "$DB_USER" -d "$DB_NAME" -c \
"UPDATE orders
 SET status='pending',
     created_at=(NOW() AT TIME ZONE 'UTC') - INTERVAL '11 minutes'
 WHERE id='$ORDER_ID';"
```

### 3. Verify status before worker cycle

```bash
curl -sS "http://localhost:${PORT}/orders/$ORDER_ID"
```

Expected:

```json
"status":"pending"
```

### 4. Wait ~1 worker cycle and verify again

```bash
curl -sS "http://localhost:${PORT}/orders/$ORDER_ID"
```

Expected:

```json
"status":"confirmed"
```

## Troubleshooting

### Missing required env var

You will see fail-fast startup errors if required vars are missing.

Check that these files exist and are filled:

- `/home/p/orders-system/.env`
- `/home/p/orders-system/api-orders/.env`

### `EADDRINUSE: 127.0.0.1:<PORT>`

Port already in use:

```bash
lsof -i :3000 -n -P
kill <PID>
```

If you use another port, replace `3000` accordingly.

### `ECONNREFUSED 127.0.0.1:<DB_PORT>`

API/Worker cannot reach Postgres.

1. Check DB container:

```bash
docker compose ps
```

2. Confirm DB vars match between root and API env files.

3. Restart API and worker after env changes.

### `release version 21 not supported`

Worker is running with wrong JDK.

Use Java 21:

```bash
export JAVA_HOME="$HOME/.sdkman/candidates/java/21-tem"
export PATH="$JAVA_HOME/bin:$PATH"
java -version
```
