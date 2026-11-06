#!/bin/sh
set -eu

export BETTER_AUTH_URL="${BETTER_AUTH_URL:-${RENDER_EXTERNAL_URL:-}}"
export RELEASE_SHA="${RELEASE_SHA:-${RENDER_GIT_COMMIT:-}}"

pnpm db:migrate:deploy
pnpm db:seed:cancer-centers
exec pnpm --filter @studepartment/web start
