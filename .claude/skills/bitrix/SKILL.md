---
name: bitrix
description: Deep on-demand reference for building or debugging a Bitrix24 feature in this template — full patterns for REST/JS-SDK calls, OAuth+JWT tokens, multi-tenancy, server-side b24Call with refresh, placements, and the install flow, plus a map into docs/. Invoke when you need more than the always-loaded backend/frontend rules give you.
---

# Bitrix24 — Deep Reference

> **Rules vs. this skill.** The `.claude/rules/` (`backend.md`, `frontend.md`)
> are **always in context** — the quick facts you reach for constantly (token
> model, API targets, `b24Call`, multi-tenancy). **This skill is the deep dive**:
> invoke it when you're actually building or debugging a Bitrix24 feature and
> want the full patterns and the doc map below. Don't duplicate the rules from
> memory — open the linked docs for working examples.

## Where to read next (full docs)

| Need | Doc |
| ---- | --- |
| Using the `@common/bitrix` package (provider, hooks, atoms, lib) | [`docs/front-end/bitrix-package.md`](../../../docs/front-end/bitrix-package.md) |
| Calling APIs from the **client** (frame vs. our backend) | [`docs/front-end/calling-apis.md`](../../../docs/front-end/calling-apis.md) |
| Install flow & placements (`install-page.tsx`, adding steps/widgets) | [`docs/front-end/installation.md`](../../../docs/front-end/installation.md) |
| Calling the Bitrix REST API from the **server** (`b24Call`, refresh) | [`docs/back-end/calling-apis.md`](../../../docs/back-end/calling-apis.md) |
| Feature-first front-end layout (features, query keys, hooks) | [`docs/front-end/feature-structure.md`](../../../docs/front-end/feature-structure.md) |

Also: [`docs/bitrix24/crm-robot.md`](../../../docs/bitrix24/crm-robot.md) and [`docs/bitrix24/widget.md`](../../../docs/bitrix24/widget.md) for CRM-robot and widget specifics.

## Mental model

A B24 app runs inside the portal's **iframe**. The JS SDK hands the frontend
OAuth credentials; the backend verifies them against Bitrix24's central OAuth
server and issues a 1-hour JWT. Portal data is reached through the REST API.

**Two tokens, never conflated:**
- **B24 OAuth** (`access_token`/`refresh_token`, stored per account, single-use refresh) → calls the **portal**.
- **Our JWT** (`{ bitrix24AccountId, userId, memberId, isAdmin }`, 1-hour) → the **session** token for our backend.

**Two call targets:** the portal (JS SDK frame, client-side) vs. our backend
(routes). Pick by need — quick CRM reads from the UI use the frame; anything
needing the DB, secrets, or multi-step logic goes through a backend route.

## Auth (server)

- Verify tokens **only** against `oauth.bitrix.info` (`services/b24-auth.ts` → `verifyB24Token`), never the client domain — a client value in the verification path lets a fake portal be trusted.
- Cross-checks: central `MEMBER_ID` vs client `member_id` (`B24_MEMBER_MISMATCH`); on `getToken`, stored `domain` vs client domain (`B24_DOMAIN_MISMATCH`).
- **Multi-tenancy:** every tenant-scoped query filters by `req.user.memberId`; gate admin ops with `req.user.isAdmin`; never trust a client-supplied `member_id`.

## Calling the portal from the backend

Route every portal REST call through `services/b24-client.ts` — it refreshes-and-retries on 401. Never hand-roll `fetch` to `/rest/`.

```ts
import { b24Call, getPortalCreds, getB24CredsById } from "../services/b24-client";

const creds = await getPortalCreds(req.user!.memberId); // admin-preferred
const { result } = await b24Call(creds, "crm.deal.list", {
  filter: { ">OPPORTUNITY": 1000 },
  select: ["ID", "TITLE", "OPPORTUNITY"],
});
```

**Token refresh** (`services/b24-oauth.ts` → `refreshAccessToken`): with
`CLIENT_ID`/`CLIENT_SECRET` set → per-account `pg_advisory_xact_lock` +
transaction, re-read the row, else call `oauth.bitrix.info/oauth/token/`.
Without them → plain DB re-read of a fresher token the frontend wrote via
`getToken` (no OAuth call, no lock). Refresh tokens are single-use → hence the lock.

## Calling from the frontend

```tsx
const $b24 = useB24Frame();                 // portal (after useB24Init().initApp())
const res = await $b24.callBatch({ deal: { method: "crm.deal.get", params: { id: 42 } } });

const api = useApiClient();                  // our backend, JWT attached
const data = await api.get("/health");
```

`callBatch` halts on first error unless you pass `false` as the 2nd arg. The
frontend never refreshes tokens — the SDK supplies fresh creds each load.

## Widgets / placements

Registered during install
(`apps/front-end/src/features/install/pages/install-page.tsx`), rendered as routes
Bitrix loads in iframes.

- Placement: `placement.bind` (unbind+rebind to stay idempotent), `HANDLER` = `${VITE_APP_URL}/handler/<name>`.
- Custom field type: `userfieldtype.add` / `userfieldtype.update` (pass `false` to `callBatch`).
- Handler URLs **must** resolve to a real route in `router.tsx` (the widget lives in its own `features/<name>/`). Set `VITE_APP_URL` or they point at the wrong origin.

See `docs/front-end/installation.md` for adding a step end-to-end.

## Install / token lifecycle

1. `POST /install` (first open) — seeds the account from the install payload; tokens come straight from the frame, no OAuth call.
2. `POST /getToken` (later opens) — re-verifies, re-issues the JWT, upserts the latest tokens so server-side jobs pick them up.
3. Server-side `b24Call` refreshes on demand when a stored token has expired.

## Gotchas

- The three `/rest/` calls in `services/b24-auth.ts` hit `oauth.bitrix.info` with a freshly frame-supplied token during *verification* — not stored-token calls, so they correctly bypass `b24Call`.
- `expires_in` from B24 is seconds; `refresh_token` is nullable.
- `@common/bitrix` is a built package — run `pnpm --filter @common/bitrix build` if the frontend can't resolve it.
