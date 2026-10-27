import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
export function syntheticOnly(): void {
  const config = JSON.parse(
    readFileSync(fileURLToPath(new URL("./environment.json", import.meta.url)), "utf8"),
  ) as { dataMode?: string; connectors?: string[]; allowedEffects?: string[] };
  if (
    config.dataMode !== "synthetic" ||
    JSON.stringify(config.connectors) !==
      JSON.stringify(["mock-store-directory", "effect-mock-log"]) ||
    JSON.stringify(config.allowedEffects) !==
      JSON.stringify(["@platform/effect-mock-log#recordSubmission"]) ||
    (process.env.FB_DATA_MODE ?? "synthetic") !== "synthetic"
  )
    throw Error("E-SYNTHETIC-ONLY");
  if (["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "SMTP_PASSWORD"].some((k) => process.env[k]))
    throw Error("E-REAL-CREDENTIAL-ENV");
}
