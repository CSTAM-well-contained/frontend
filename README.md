# CSTAM console

Admin web console for the CSTAM control plane (`cpd`, in
[`monorepo`](https://github.com/CSTAM-well-contained/monorepo)). React 18, TypeScript, Vite,
TanStack Query, Tailwind, Radix. Every value comes from the REST API; every button calls one
endpoint (`docs/official/openapi.yaml` in the monorepo is the contract).

Pages: Overview (gateways, MASTER first, failover/failback), Hackathons, Teams (spin up, renew,
tear down, detail drawer), IP pool, Traffic, Config (push, roll back), Events, Routes. `⌘K` /
`Ctrl+K` opens the command menu.

## Run locally

Needs Node 22+ and a running `cpd`.

```bash
npm ci
cp .env.example .env          # CPD_URL: where the dev server proxies /v1 and /healthz
npm run dev                   # http://localhost:5173
```

Sign in with the admin token (full control) or the viewer token (read-only: every page, no
button; cpd answers 403 to writes anyway). The token stays in the tab's `sessionStorage`.

`cpd` sends no CORS headers, so the browser always talks to the same origin: the Vite dev server
(and `npm run preview`) proxy `/v1` and `/healthz` to `CPD_URL`; in production nginx does.

### Against the local demo stack

```bash
cd ../monorepo && make build && deploy/dev/demo.sh up && deploy/dev/demo.sh teams 4
cd ../frontend && CPD_URL=http://10.20.0.1:8443 npm run dev
cat "$XDG_RUNTIME_DIR/cstam-demo/admin.token"    # paste it on the login page
```

### Against FelCloud (SSH tunnel)

`cpd` only listens on the private network and speaks plain HTTP: go through the control plane.

```bash
ssh -L 8443:10.20.0.5:8443 cp      # keep it open
CPD_URL=http://localhost:8443 npm run dev
```

## Build and deploy

```bash
npm run build                 # static files in dist/
docker build -f deploy/Dockerfile -t cstam-frontend .
docker run -p 8080:8080 -e CPD_UPSTREAM=http://10.20.0.5:8443 cstam-frontend
# or, for a cpd on this machine (demo stack):
docker compose up --build     # http://localhost:8080, CPD_UPSTREAM=http://host.docker.internal:8443
```

The image is nginx serving `dist/` and reverse-proxying `/v1` and `/healthz` to `CPD_UPSTREAM`
(`deploy/nginx.conf.template`, rendered by the image's `envsubst` at start). It sets
`Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'
'unsafe-inline'; frame-ancestors 'none'`, `X-Content-Type-Options: nosniff`,
`Referrer-Policy: no-referrer` and `X-Frame-Options: DENY`.

## Scripts

| Script                    | What                                                                                                                                                                                                                                                                    |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `dev`, `build`, `preview` | Vite                                                                                                                                                                                                                                                                    |
| `gen:api`                 | regenerate `src/api/schema.d.ts` from `../monorepo/docs/official/openapi.yaml` (override with `OPENAPI_PATH`); commit the result                                                                                                                                        |
| `lint`                    | ESLint (`react/no-danger`, no `eval`/`innerHTML`) and Prettier                                                                                                                                                                                                          |
| `typecheck`               | `tsc -b` (strict)                                                                                                                                                                                                                                                       |
| `test`                    | Vitest + Testing Library; the API is mocked with MSW handlers typed from the contract                                                                                                                                                                                   |
| `test:e2e`                | Playwright against the real demo stack: login, spin up → ready → tear down, planned failover. Starts `npm run dev` itself; tokens from `CSTAM_ADMIN_TOKEN`/`CSTAM_VIEWER_TOKEN` or `$XDG_RUNTIME_DIR/cstam-demo/*.token`. First time: `npx playwright install chromium` |

## Layout

```
src/api/          client.ts (openapi-fetch, bearer token, ApiError), schema.d.ts (generated), queries.ts (one hook per endpoint)
src/components/   ui/ (button, input, dialog...), layout/ (top bar, tabs, live pill, ⌘K, confirm), status/, tables/, teams.tsx, hackathons.tsx
src/pages/        one file per page
src/lib/          format.ts, validation.ts (label regex, zod schemas), auth.ts, theme.ts, events.ts
src/test/         MSW server and fixtures, security test (fails on dangerouslySetInnerHTML, innerHTML, eval...)
e2e/              Playwright specs
deploy/           Dockerfile, nginx.conf.template
docs/             backend-requests.md: what the console would like from cpd
```

## Behaviour notes

- Polling per page as in the monorepo's `dashboard.md` (status and teams 1 s, IP pool and events
  2 s, hackathons, config and routes 5 s); it stops while the tab is hidden.
- The "live" pill turns red with the time of the last answer, plus a banner, when `cpd` has not
  answered for 3 s. Alerts computed by `cpd` (split brain, no master...) are red banners.
- 401 anywhere signs out and shows the reason on the login page. 403 says the token is
  read-only. 409 on a planned failover offers a forced failover behind a second confirmation.
  503 on spin-up shows "pool full, retry in N s" from `Retry-After`.
- Names are checked with the contract's label regex before sending; the app port must be 80 or
  8000-8099.
- Hosts and paths in the traffic log come from the internet and are only ever rendered as text.
