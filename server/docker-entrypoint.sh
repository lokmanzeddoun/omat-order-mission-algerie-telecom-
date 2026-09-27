#!/bin/sh
set -eu
npx prisma migrate deploy --schema server/prisma/schema.prisma
exec node server/dist/main.js
