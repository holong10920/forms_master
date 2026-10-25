import { isSha256Hex } from "./digest.ts";
import type { PayloadRefV1 } from "./generated/payload-ref.v1.ts";

export type { PayloadRefV1 };

export interface SemanticError {
  code: string;
  path: string;
}

/** Semantic checks of a structurally valid PayloadRef (spec #5 section 5.3). Same order and codes
 * as fb_contracts.payload_ref. */
export function checkPayloadRef(ref: PayloadRefV1): SemanticError[] {
  const errors: SemanticError[] = [];
  const hasInline = Object.hasOwn(ref, "inline");
  const hasBlobKey = ref.blobKey !== undefined;
  if (hasInline === hasBlobKey) errors.push({ code: "E-PAYLOADREF-STORAGE", path: "" });
  if (!isSha256Hex(ref.sha256)) errors.push({ code: "E-DIGEST-FORMAT", path: "/sha256" });
  if (hasBlobKey && ref.blobKey !== `sha256/${ref.sha256}`) {
    errors.push({ code: "E-PAYLOADREF-BLOBKEY", path: "/blobKey" });
  }
  return errors;
}
