// Type-safe `t()` keys and namespaces.
// See https://www.i18next.com/overview/typescript
// The shape is derived from the real `resources`/`defaultNS` in `@/lib/i18n`,
// so `en.json` (the default-namespace source) drives autocomplete and
// compile-time key checking.
import type { defaultNS, resources } from "@/lib/i18n";

declare module "i18next" {
  interface CustomTypeOptions {
    defaultNS: typeof defaultNS;
    resources: (typeof resources)["en"];
  }
}
