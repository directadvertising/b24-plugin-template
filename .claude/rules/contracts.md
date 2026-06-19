---
paths:
  - "packages/contracts/**/*.ts"
---

# Contracts Rules (`packages/contracts/`)

Package `@common/contracts`. **Multi-contract**: each feature/domain owns a
`src/<name>-contract.ts` file exporting a named contract (e.g. `BitrixContract`),
and `src/index.ts` re-exports them all. Add a new contract as its own file, then
`export * from "./<name>-contract"` in `index.ts`.

```ts
// src/bitrix-contract.ts
import { createContract, type InferContractBody } from "contracts";
import { z } from "zod";

export const BitrixContract = createContract({
  routes: {
    getToken: {
      method: "POST",           // GET | POST | PUT | PATCH | DELETE
      name: "Get Session Token",
      description: "Exchanges B24 creds for a JWT",
      path: "/getToken",         // callable: route.path() / route.pathTemplate
      params: null,              // Zod object if path has :param, else null
      query: null,               // Zod schema | null (required)
      body: z.object({ AUTH_ID: z.string() }), // Zod schema | null (required)
      data: z.object({ token: z.string() }),   // success schema | null
      errorCodes: ["ACCOUNT_NOT_FOUND"],        // custom error identifiers
    },
  },
});

// Export named body/data types per route for ergonomic imports:
export type GetTokenBody = InferContractBody<typeof BitrixContract, "getToken">;
```

**Type inference helpers** (re-exported from `index.ts`):
`InferContractBody`, `InferContractQuery`, `InferContractParams`,
`InferContractData`, `ContractRouteKeys` — e.g.
`InferContractData<typeof BitrixContract, "getToken">`.

**Wiring:** the back-end binds a route with
`contractMiddleware(BitrixContract.routes.getToken)` at
`BitrixContract.routes.getToken.pathTemplate`; handlers `res.json(data)` and the
middleware wraps + validates it.

**Response envelope:** `{ success: true, data: T }` or
`{ success: false, error: { code, message } }`. Server validates returns against
`data` (500 on mismatch); the front-end unwraps `.data`.
