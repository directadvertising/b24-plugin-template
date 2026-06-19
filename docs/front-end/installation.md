# Installation & placements

The install handler is the `/install` route
(`apps/front-end/src/features/install/pages/install-page.tsx`), configured as the
app's install URL in the Bitrix24 portal. It runs once when the app is installed
and registers the app's widgets (placements, user-field types), then hands control
back to the portal.

## How the install page works

`runInstall()` initializes the frame, then runs an **ordered step machine** —
each step has a `caption` and an async `action`:

1. `init` — `callBatch` for `app.info` and `profile` (data the later steps need).
2. `serverSide` — `postInstall(...)` to our backend (verifies token, seeds the
   account row).
3. `finish` — `setProgress(100)` then `$b24.installFinish()`.

Steps run in object order; a throw aborts and shows the error.

> The template ships only the minimal flow above. Registering **placements** and
> **custom user-field types** is done by adding steps — the worked examples below
> are the demos that used to live in the page. When you add either, also fetch the
> existing widgets in `init` (`placement.get` / `userfieldtype.list`) so the new
> step can be idempotent, and set `VITE_APP_URL` (used to build handler URLs).

## Add an installation step

Add an entry to the `steps` object (and a branch to the `caption` ternary so the
UI shows a label):

```ts
myThing: {
  caption: "Registering my thing...",
  action: async () => {
    await $b24.callBatch([{ method: "crm.status.add", params: { /* ... */ } }]);
  },
},
```

Make actions **idempotent** — install can re-run. Use the `init` data to check
existence and update instead of duplicate.

## Example: register a placement

A placement embeds your app in a Bitrix UI slot (e.g. a CRM deal tab). The
`HANDLER` is a URL Bitrix loads in an iframe — it must resolve to a real route.
`appUrl` is `VITE_APP_URL` (trailing slash stripped). This step rebinds when the
placement already exists (from `init`'s `placement.get`) so it stays idempotent:

```ts
placement: {
  caption: "Registering placements...",
  action: async () => {
    const key = {
      placement: "CRM_DEAL_DETAIL_TAB",
      handler: `${appUrl}/handler/placement-crm-deal-detail-tab`,
    };
    const exists = stepsData.init?.placementList?.some(
      (item) => item.placement === key.placement && item.handler === key.handler,
    );

    const bind = {
      method: "placement.bind",
      params: {
        PLACEMENT: key.placement,
        HANDLER: key.handler,
        TITLE: "Some Tab",
        OPTIONS: { errorHandlerUrl: `${appUrl}/handler/background-some-problem` },
      },
    };

    await $b24.callBatch(
      exists
        ? [{ method: "placement.unbind", params: { PLACEMENT: key.placement } }, bind]
        : [bind],
    );
  },
},
```

Then add the matching route in `apps/front-end/src/router.tsx`, with the widget
living in its own feature (`features/<widget>/pages/`):

```tsx
import { DealTabWidget } from "@/features/deal-tab";
<Route path="/handler/placement-crm-deal-detail-tab" component={DealTabWidget} />;
```

Inside the widget, read placement context via `$b24.placement.title` / `.options`.

## Example: register a custom user-field type

Custom field types use `userfieldtype.add` / `userfieldtype.update`. Pass `false`
as the second `callBatch` arg so a re-add doesn't abort the batch. Existence is
checked against `init`'s `userfieldtype.list`:

```ts
userFields: {
  caption: "Registering user field types...",
  action: async () => {
    const typeId = `some_type_${import.meta.env.DEV ? "dev" : "prod"}`;
    const exists = stepsData.init?.userFieldTypeList?.some(
      (item) => item.USER_TYPE_ID === typeId,
    );

    const params = {
      USER_TYPE_ID: typeId,
      HANDLER: `${appUrl}/handler/uf.demo`,
      TITLE: `[${import.meta.env.DEV ? "dev" : "prod"}] Some Type`,
      DESCRIPTION: "Some Description",
      OPTIONS: { height: 105 },
    };

    await $b24.callBatch(
      [{ method: exists ? "userfieldtype.update" : "userfieldtype.add", params }],
      false,
    );
  },
},
```

Both examples read `stepsData.init?.placementList` / `.userFieldTypeList`, so
re-add those calls to the `init` batch and the fields back to `InitData`:

```ts
const response = await $b24.callBatch({
  appInfo: { method: "app.info" },
  profile: { method: "profile" },
  placementList: { method: "placement.get" },
  userFieldTypeList: { method: "userfieldtype.list" },
});

interface InitData {
  appInfo?: AppInfo;
  profile?: { ID?: string | number };
  placementList?: { placement: string; handler: string }[];
  userFieldTypeList?: { USER_TYPE_ID: string }[];
}
```

Gotcha: set `VITE_APP_URL`, or every `HANDLER` points at the wrong origin.
