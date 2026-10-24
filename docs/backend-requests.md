# Requests for the backend (`monorepo`)

Things the frontend needs or would like from `cpd`. Nothing here was changed in the backend.

## 1. `vip` is missing from the contract

`GET /v1/status` returns `"vip": "10.20.0.10"` (`internal/lifecycle/records.go`, field `VIP`),
and the old dashboard shows "VIP 10.20.0.10 is here", but `Status` in `openapi.yaml` has no
`vip` property. The console follows the contract and says "VIP is here" without the address.
**Ask:** add `vip: {type: string, description: "public entry the MASTER holds"}` to
`components.schemas.Status`; then `npm run gen:api` and show it on the MASTER card.

## 2. No `required` lists on response schemas

Every response property is optional in the generated types (`Team.id?`, `Status.gateways?`...),
so the console guards against `undefined` everywhere. **Ask:** add `required:` to `Team`,
`Hackathon`, `Gateway`, `Status`, `Address`, `Event`, `ConfigVersion`, `TrafficPage` for the
fields cpd always sends.

## 3. `Event.detail` is an untyped object

`detail: {type: object}` gives no shape per `kind` (`team.ready` has `seconds`, `config.*` has
`gateway`, `version`, `serving`, `error`...). The console's one-line summaries rely on the old
dashboard's wording, not on the contract. **Ask (nice to have):** document the detail keys per
kind, or a `oneOf` keyed by `kind`.

## 4. CORS (only if the console is ever served from another origin)

cpd sends no CORS headers, so the console must be on the same origin as `/v1` (Vite proxy in
dev, nginx in prod). This works and needs nothing today. If the console is ever hosted
separately, cpd would need `Access-Control-Allow-Origin` for that exact origin plus
`Access-Control-Allow-Headers: Authorization, Content-Type` and `OPTIONS` preflight answers.

## 5. Push instead of polling (optional)

The console polls (1-5 s per page, paused in hidden tabs), as the old dashboard does. An
`EventSource` cannot send the bearer header; if pushing is ever wanted, a WebSocket or SSE
endpoint authenticated by a short-lived query token would be needed. Not needed for the demo.
