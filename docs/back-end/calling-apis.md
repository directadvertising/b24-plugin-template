# Calling the Bitrix24 REST API from the backend

Always go through `apps/back-end/src/services/b24-client.ts`. It uses stored
OAuth tokens, and **refreshes-and-retries once on HTTP 401** so token handling
stays uniform. Never hand-roll `fetch` to a portal `/rest/` endpoint.

## Resolve credentials, then call

```ts
import { b24Call, getPortalCreds, getB24CredsById } from "../services/b24-client";

// For the current portal (admin account preferred, else latest with a token):
const creds = await getPortalCreds(req.user!.memberId);

// ...or a specific account (e.g. the caller from the JWT):
const creds = await getB24CredsById(req.user!.bitrix24AccountId);

const { result } = await b24Call(creds, "crm.deal.list", {
  filter: { ">OPPORTUNITY": 1000 },
  select: ["ID", "TITLE", "OPPORTUNITY"],
});
```

- `b24Call(creds, method, params)` → POSTs to
  `https://{domain}/rest/{method}?auth={token}`.
- On 401 it runs `refreshAccessToken(creds)` once and retries; still failing →
  throws `ContractError("B24_AUTH_EXPIRED")`. API errors →
  `ContractError("B24_API_ERROR")`.
- Multi-tenancy: resolve creds from `req.user.memberId` / `bitrix24AccountId`
  (JWT values) — never a client-supplied portal id.

## Token refresh (`services/b24-oauth.ts`)

`refreshAccessToken(creds)` mutates `creds` in place and persists the new token:

- **`CLIENT_ID` + `CLIENT_SECRET` set** → serialized per account via
  `pg_advisory_xact_lock` + a transaction: re-read the row (a concurrent caller
  may have already refreshed), else call `oauth.bitrix.info/oauth/token/`.
  Refresh tokens are **single-use**, which is why refreshes are serialized.
- **Missing either** → fall back to a plain DB re-read (a frontend `getToken`
  may have written a fresher token). No OAuth call, no lock.

You rarely call this directly — `b24Call` handles it.

## Use in a route

Bind the contract, require auth, scope by `memberId`:

```ts
router.get(
  $.routes.listDeals.pathTemplate,
  contractMiddleware($.routes.listDeals),
  authMiddleware,
  async (req, res) => {
    const creds = await getPortalCreds(req.user!.memberId);
    const { result } = await b24Call(creds, "crm.deal.list", {});
    res.json(result); // auto-wrapped as { success: true, data }
  },
);
```

> Note: the three `/rest/` calls in `services/b24-auth.ts` hit
> `oauth.bitrix.info` with a freshly frame-supplied token during *verification* —
> that's not a stored-token call and correctly bypasses `b24Call`.
