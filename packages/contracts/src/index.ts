// Multi-contract package: each feature/domain owns a contract file and exports
// a named contract (e.g. `BitrixContract` from `./bitrix-contract`). Add new
// contracts as `./<name>-contract.ts` and re-export them here.

// Generic inference helpers, re-exported so consumers derive types from any
// contract without depending on `contracts` directly:
//   InferContractBody<typeof BitrixContract, "getToken">
export type {
  ContractRouteKeys,
  InferContractBody,
  InferContractData,
  InferContractParams,
  InferContractQuery,
} from "contracts";
export * from "./bitrix-contract";
