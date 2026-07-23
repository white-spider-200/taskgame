# taskgame

## Deploy (git pull + pm2)

Same pattern as `agatecompany`: pull, install, migrate, build, reload via PM2. Run on the server from the repo root.

1. First-time server setup:
   - `git clone git@github.com:white-spider-200/taskgame.git && cd taskgame`
   - `cp web/.env.production.example web/.env.production` and fill in `DATABASE_URL` (point it outside the repo, e.g. `/home/server/data/taskgame/prod.db`) and a real `SESSION_SECRET`
   - `cd web && npm ci && npm run db:generate && npm run db:migrate:prod && npm run build && cd ..`
   - `pm2 start ecosystem.config.cjs`
2. Every subsequent deploy: `./scripts/deploy-git-pm2.sh`

The app listens on `PORT` (default `3012`, set in `ecosystem.config.cjs`). Put nginx/a reverse proxy in front of it for TLS, same as the other Node apps on this box.
