# Database migration strategy

Studepartment now keeps Prisma migration history in the repository and validates it against a fresh PostgreSQL instance in CI.

## Why there is a baseline migration

The original v0.1 scientific-domain schema was created in the development Neon database before migration files were committed. The migration `20260912000000_foundation_baseline` captures that exact pre-authentication domain as the baseline for reproducible environments.

The next migration, `20260918_scientific_identity_v1`, is additive and introduces account/session tables plus scientific provenance.

## Fresh database

For a new empty PostgreSQL database:

```bash
pnpm install
pnpm db:generate
pnpm db:migrate:deploy
```

This applies the baseline first and then all later migrations.

## Adopting an existing v0.1 database

Do **not** run the baseline SQL against an existing database that already contains the v0.1 tables. Before changing migration state:

1. Take a database snapshot/backup.
2. Confirm the deployed schema corresponds to the v0.1 baseline.
3. Mark only the baseline as already applied:

```bash
pnpm --filter @studepartment/db exec prisma migrate resolve \
  --applied 20260912000000_foundation_baseline
```

4. Apply later migrations:

```bash
pnpm db:migrate:deploy
```

This tells Prisma that the pre-existing scientific-domain schema is the baseline without attempting to recreate its tables.

## Development migrations

Use `pnpm db:migrate` only when intentionally creating or testing a new migration in a development database. Deployment environments should use `pnpm db:migrate:deploy`.

## CI invariant

CI starts an empty PostgreSQL service and runs the full migration chain before lint, typecheck, and build. A pull request therefore fails if the committed migration history cannot reconstruct a usable schema from zero.

## Production rule

Never use `prisma db push` as a production deployment mechanism. Schema changes must be represented by reviewed migrations, and destructive changes require an explicit backup and rollout plan.
