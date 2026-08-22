# Deployment checklist

## Production configuration

Use `docker-compose.production.yml` with environment variables supplied by the deployment platform or a secret manager. Do not commit `.env` files or provider keys.

Required variables:

- `DB_USER`, `DB_PASSWORD`, `DB_NAME`
- `JWT_SECRET`
- `CLIENT_URL` set to the HTTPS frontend origin

Optional AI variables are disabled by default. Set `AI_PROVIDER` and a newly issued provider key only when AI features are required.

Validate and start the stack:

```powershell
docker compose --env-file .env.production -f docker-compose.production.yml config --quiet
docker compose --env-file .env.production -f docker-compose.production.yml up -d --build
```

The production Compose file does not publish PostgreSQL. Expose the backend only through an HTTPS reverse proxy or managed ingress, with TLS termination, rate limiting, and access logs enabled.

## Operations

- Use managed PostgreSQL where possible, with private networking, encrypted connections, automated backups, point-in-time recovery, and tested restore procedures.
- Monitor backend `/health`, container restarts, latency, HTTP 5xx responses, database connections, disk usage, and migration failures.
- Send application logs and audit logs to a centralized, access-controlled log service. Never log passwords, tokens, or provider keys.
- Rotate database, JWT, and provider credentials through the secret manager. A JWT rotation invalidates existing sessions.
- Run `npm audit` in both `server` and `rackvue-insight` in CI and block releases on critical findings.
- Build the frontend with `npm run build` and serve the generated output through the selected hosting platform.

## Security follow-up

The `xlsx` package currently has advisories without an upstream fix. Review whether spreadsheet import can be replaced or isolated in a sandbox before exposing it to untrusted uploads.
