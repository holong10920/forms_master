export const CONTRACTS_PACKAGE = "@fb/contracts";

export { canonicalJson, canonicalJsonBytes, JcsError } from "./jcs.ts";
export { isSha256Hex, jcsSha256Hex, sha256Hex } from "./digest.ts";
export {
  createAjv,
  normalizeAjvErrors,
  normalizeErrors,
  validateSchema,
  validateWith,
  type SchemaError,
  type SchemaId,
  type SchemaResult,
} from "./schema.ts";
export { checkPayloadRef, type PayloadRefV1, type SemanticError } from "./payload-ref.ts";

export type { FormDefinitionV1 } from "./generated/form-definition.v1.ts";
export type {
  EngineIRV1,
  Expression as EngineExpression,
  Field as EngineField,
  Node as EngineNode,
  Group as EngineGroup,
  Step as EngineStep,
  Display as EngineDisplay,
  DisplayLeaf as EngineDisplayLeaf,
  DisplayText as EngineDisplayText,
} from "./generated/engine-ir.v1.ts";
