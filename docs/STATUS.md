# Status

## Done (written, NOT executed)
- Project config: package.json, tsconfig (strict), next.config (security headers), .gitignore, .env.example
- Prisma schema (all required + supporting models)
- Migration with CHECK constraints and GiST exclusion constraint
- Booking core: date parsing, decimal pricing, createBooking with 409 mapping + idempotency
- Unit tests for dates/pricing

## Not verified
- `npm install`, `prisma generate/migrate`, typecheck, tests (sandbox had no network, Postgres, or Redis)
- Exact Prisma error shape for exclusion violations (needs the Stage 5 concurrency integration test)

## Remaining
Stages 3-10: auth, listings/pages, booking API + concurrency tests, Mapbox search, AI host, reviews/admin, e2e, deployment docs.
