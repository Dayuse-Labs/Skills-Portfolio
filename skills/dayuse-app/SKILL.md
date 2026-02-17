---
name: "dayuse-commands"
description: "Run local development commands on the Dayuse.com project. Use when starting/stopping Docker, running PHP tests (PHPUnit), frontend tests, linting (PHPStan, CS-Fixer, ESLint), database migrations, Elasticsearch indexing, translations, or any inv task. All commands require pipenv and Docker."
---

# Dayuse App Commands

## Overview

All local development commands for the Dayuse.com project use **Python Invoke** (prefixed with `inv`) and **must be run through pipenv** from the project root.

## Prerequisites

- Docker Desktop running
- pipenv installed (`pip install pipenv`)
- Working directory: `/Users/fabiendauvergne/PhpstormProjects/dayuse-com`

## Critical Rules

1. **Always prefix commands with `pipenv run`** to ensure the correct Python environment:
   ```bash
   pipenv run inv <command>
   ```
2. **Always run from the project root**: `/Users/fabiendauvergne/PhpstormProjects/dayuse-com`
3. **Docker containers must be running** for most commands. If unsure, run `pipenv run inv up` first.
4. **Never run `inv` directly** without `pipenv run` — it may use the wrong Python/invoke version.

---

## Quick Reference

| Action | Command |
|--------|---------|
| Start everything | `pipenv run inv start` |
| Start containers only | `pipenv run inv up` |
| Stop containers | `pipenv run inv stop` |
| Run PHP tests | `pipenv run inv phpunit` |
| Run specific PHP test | `pipenv run inv phpunit --filter-tests=MyTest` |
| PHPStan analysis | `pipenv run inv phpstan` |
| Fix code style | `pipenv run inv cs-fix` |
| Frontend tests | `pipenv run inv front-web-test` |
| DB migration | `pipenv run inv migrate` |

---

## Infrastructure

### Start & Stop

```bash
# Full setup: build + start + install deps + migrate DB
pipenv run inv start

# Build Docker images + start containers (no install/migrate)
pipenv run inv up

# Build Docker images only
pipenv run inv build

# Stop all containers
pipenv run inv stop

# Destroy everything (containers, volumes, networks) — DESTRUCTIVE
pipenv run inv destroy
```

### Monitoring

```bash
# List container status
pipenv run inv ps

# Show container logs
pipenv run inv logs

# Open bash shell in builder container
pipenv run inv builder
```

### Workers (RabbitMQ consumers)

```bash
# Start worker containers
pipenv run inv start-workers

# Stop worker containers
pipenv run inv stop-workers
```

---

## PHP Backend Testing

```bash
# Full test suite (creates test DB + fixtures + PHPUnit)
pipenv run inv tests

# Run PHPUnit only (assumes test DB already exists)
pipenv run inv phpunit

# Run specific test(s) by filter
pipenv run inv phpunit --filter-tests=MyTestClass
pipenv run inv phpunit --filter-tests=testMethodName

# Run with code coverage
pipenv run inv phpunit --coverage

# Create/reset test database with fixtures
pipenv run inv create-test-env

# Import specific fixtures
pipenv run inv import-fixtures
```

---

## PHP Code Quality

```bash
# PHPStan static analysis (level 10)
pipenv run inv phpstan

# PHP-CS-Fixer — auto-fix code style
pipenv run inv cs-fix

# PHP-CS-Fixer — check only (dry-run, used in CI)
pipenv run inv cs-fix --dry-run

# PHP syntax + YAML + Twig linting
pipenv run inv lint

# Validate Doctrine schema against entities
pipenv run inv schema-validate
```

---

## Frontend (Next.js / React)

### Web

```bash
# Jest tests
pipenv run inv front-web-test

# ESLint
pipenv run inv front-web-lint

# TypeScript type check
pipenv run inv front-web-type

# Prettier formatting check
pipenv run inv front-web-prettier

# Unit tests (alternative)
pipenv run inv tests-unit-front

# Reset frontend API cache
pipenv run inv reset-frontend-api
```

### Mobile App

```bash
# Unit tests
pipenv run inv test-app

# ESLint
pipenv run inv lint-app

# TypeScript compliance
pipenv run inv typing-app

# Format check
pipenv run inv format-app

# Check XCode plist files
pipenv run inv check-plist
```

---

## Database

```bash
# Run pending migrations
pipenv run inv migrate

# Generate a new migration
pipenv run inv make-migration

# Load a SQL dump into dayuse_dev
pipenv run inv mysql-load-dump

# Snapshot current MySQL volume (for fast restore later)
pipenv run inv volume-mysql-snapshot

# Restore MySQL volume from snapshot
pipenv run inv volume-mysql-snapshot-restore
```

---

## Elasticsearch

```bash
# Rebuild hotel index (full)
pipenv run inv es-build-hotel

# Rebuild hotel index for specific country
pipenv run inv es-build-hotel --country=FR

# Rebuild POI index
pipenv run inv es-build-poi

# Rebuild billing index
pipenv run inv es-build-billing

# Rebuild order index
pipenv run inv es-build-order

# Setup ES snapshot
pipenv run inv es-setup-snapshot

# Reset ES snapshot
pipenv run inv es-reset-snapshot

# Restore hotel index from snapshot
pipenv run inv es-restore-hotel-snapshot

# Restore POI index from snapshot
pipenv run inv es-restore-poi-snapshot
```

---

## Translations

```bash
# Download translations from Loco (frontend + backend)
pipenv run inv loco-download

# Download translations, commit, and push (for releases)
pipenv run inv finalize-release
```

---

## Other Utilities

```bash
# Clear Symfony cache
pipenv run inv cache-clear

# Clear dev.log
pipenv run inv log-clear

# Install all dependencies (composer + yarn)
pipenv run inv install

# Install composer dependencies only
pipenv run inv composer-install

# Generate SSL certificates
pipenv run inv generate-certificates

# Display help with local URLs
pipenv run inv help
```

---

## CI Pipeline Commands

When running in CI mode, first set the CI flag:

```bash
pipenv run inv ci
```

CI runs these checks (all must pass):
1. `pipenv run inv phpunit` — PHP unit tests
2. `pipenv run inv phpstan` — Static analysis
3. `pipenv run inv cs-fix --dry-run` — Code style check
4. `pipenv run inv lint` — Syntax linting
5. `pipenv run inv schema-validate` — Doctrine schema
6. `pipenv run inv front-web-lint` — Frontend ESLint
7. `pipenv run inv front-web-type` — Frontend TypeScript
8. `pipenv run inv front-web-prettier` — Frontend formatting

---

## Local Development URLs

Once containers are running (`pipenv run inv up`):

| Service | URL |
|---------|-----|
| API | https://api.dayuse.test/ |
| Back Office | https://bo.dayuse.test/ |
| Partners Extranet | https://partners.dayuse.test/ |
| Search API | https://api-search.dayuse.test/ |
| Redirects | https://r.dayuse.test/ |
| RabbitMQ | https://rabbitmq.dayuse.test/ |
| Mailcatcher | https://mail.dayuse.test/ |

---

## Troubleshooting

### Containers not starting
**Symptoms**: `inv up` fails or containers crash
**Solution**:
```bash
pipenv run inv destroy
pipenv run inv start
```

### Test DB out of date
**Symptoms**: PHPUnit fails with schema errors
**Solution**:
```bash
pipenv run inv create-test-env
pipenv run inv phpunit
```

### pipenv not found or wrong Python
**Symptoms**: `pipenv: command not found` or import errors
**Solution**:
```bash
pip install pipenv
cd /Users/fabiendauvergne/PhpstormProjects/dayuse-com
pipenv install
```

### Elasticsearch index empty or stale
**Symptoms**: Search returns no results
**Solution**:
```bash
pipenv run inv es-build-hotel
pipenv run inv es-build-poi
```
