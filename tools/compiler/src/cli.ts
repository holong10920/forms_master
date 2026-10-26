import { syntheticOnly } from "../../local_p0/guard.ts";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { compile, root } from "./build.ts";
import { startServer } from "./server.ts";
import { publishDemo } from "./publish.ts";
syntheticOnly();
const [command, ...args] = process.argv.slice(2);
if (command === "build") {
  const names = args.length ? args : ["sports", "sports-subtle", "pc-plugin"];
  for (const name of names) {
    if (!["sports", "sports-subtle", "pc-plugin"].includes(name))
      throw new Error("unknown approved fixture");
    const r = await compile(
      JSON.parse(
        readFileSync(join(root, `contracts/fixtures/engine/${name}.json`), "utf8"),
      ) as unknown,
      join(root, "var/s2-candidates"),
    );
    console.log(
      JSON.stringify({
        name,
        candidateId: r.candidateId,
        url: `http://127.0.0.1:4173${r.urlPath}`,
        builderVerification: "VERIFICATION_PENDING",
      }),
    );
  }
} else if (command === "serve" && !args.length) startServer();
else if (command === "publish-demo" && !args.length)
  console.log(JSON.stringify(await publishDemo(), null, 2));
else throw new Error("usage: build [sports|sports-subtle|pc-plugin] | serve | publish-demo");
