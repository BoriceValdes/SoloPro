# SoloPro (sans Prisma) — Next.js + React + PostgreSQL (pg)

MVP : Clients / Services / Factures + Swagger pour tester l'API REST.

## 1. Installation

```bash
npm install
cp .env.example .env
```

## 2. Base de données PostgreSQL

```bash
docker compose up -d
psql -h localhost -U postgres -d solopro -f sql/schema.sql
```

(Sur Windows, tu peux exécuter `sql/schema.sql` avec PgAdmin / DBeaver)

## 3. Seed

```bash
npm run db:seed
```

## 4. Lancer

```bash
npm run dev
```

- App : http://localhost:3000  
- Swagger : http://localhost:3000/docs  
- OpenAPI : http://localhost:3000/api/openapi.json  

Auth de test : `Authorization: Bearer DEMO_TOKEN`

## Auth (register/login)

- POST /api/auth/register  -> body { email, password, name }  -> returns { user, token }
- POST /api/auth/login     -> body { email, password }        -> returns { user, token }
- GET  /api/auth/me        -> requires Authorization: Bearer <token>

Use the returned token as `Authorization: Bearer <token>` for protected endpoints.

## PDF invoices
- POST /api/invoices/{id}/pdf  -> Generates a PDF and returns { url } (file stored in public/pdfs/)

