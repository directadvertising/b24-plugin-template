import {
  type ContractRouteKeys,
  createContract,
  type InferContractBody,
  type InferContractData,
  type InferContractParams,
  type InferContractQuery,
} from "contracts";

/**
 *
 */
export const $ = createContract({});

export namespace $ {
  export type Route = ContractRouteKeys<typeof $>;
  export type Body<K extends Route> = InferContractBody<typeof $, K>;
  export type Query<K extends Route> = InferContractQuery<typeof $, K>;
  export type Params<K extends Route> = InferContractParams<typeof $, K>;
  export type Data<K extends Route> = InferContractData<typeof $, K>;
}
