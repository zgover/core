# @aglyn/tenant-runtime

Server-side host-event runtime shared by the tenant app and feature plugins
(AGL-396). Hosts the event fan-out that no single plugin owns:

- `emitHostEvent` — the one emit point; fans an event out to the workflow
  runner and the actions runner, returning any site alerts for
  request/response emitters (form submit, booking) to surface.
- `runEventActions` / `runSingleAction` — the AGL-148 action runtime
  (webhooks, alerts, data writes) with depth/step bounds.
- `runEventWorkflows` — the AGL-128 event-triggered workflow runner.

It also hosts the server-side **screen-composition pipeline** — `getScreen`,
`composeScreenNodes`, and the `get-*` version/component/variable/dataset
loaders behind it — reached via subpath imports
(`@aglyn/tenant-runtime/compose-screen-nodes`, etc.). This is the tenant
render read-path shared by the app's SSR and any plugin that needs to
compose a screen server-side (e.g. commerce's members-only content route).

Depends only on `@aglyn/aglyn`, `@aglyn/tenant-data-admin`, and
`firebase-admin`, so it is importable from both `apps/tenant` API routes and
plugin `server.ts` handlers without pulling app code into a lib.
