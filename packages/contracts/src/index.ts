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
