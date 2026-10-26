import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { execFileSync } from "node:child_process";
import { expect, test } from "vitest";
import { compileRelease } from "../src/release.ts";
import { root } from "../src/build.ts";
import { canonicalJson } from "@fb/contracts";
test("host K13 yields stable canonical release bytes, immutable manifests, semantic parity and publication/rollback", async () => {
  const dir = mkdtempSync(join(tmpdir(), "fb-release-proof-"));
  try {
    const definition = JSON.parse(
      readFileSync(join(root, "contracts/fixtures/engine/sports.json"), "utf8"),
    ) as Record<string, unknown>;
    const a = await compileRelease(definition, join(dir, "a")),
      b = await compileRelease(definition, join(dir, "b"));
    expect(a.candidateId).toMatch(/^rel_[a-z2-7]{26}$/u);
    expect(b.candidateId).toBe(a.candidateId);
    for (const path of [...a.manifest.inventory.map((f) => f.path), "index.html"])
      expect(
        readFileSync(join(a.directory, path)).equals(readFileSync(join(b.directory, path))),
      ).toBe(true);
    const provenance = JSON.parse(
      readFileSync(join(dir, "a/private", a.candidateId, "provenance.json"), "utf8"),
    ) as { reproducibility: { finalIdentical: boolean } };
    expect(provenance.reproducibility.finalIdentical).toBe(true);

    expect(a.manifest.lrmFormat).toBe(1);
    expect(a.manifest.toolchain.verificationScope).toBe("HOST_ONLY");
    expect(a.manifest.toolchain.builderImage).toBeUndefined();
    const privateDir = join(dir, "a/private", a.candidateId);
    expect(readFileSync(join(privateDir, "lrm.json"), "utf8")).toBe(canonicalJson(a.manifest));
    expect(
      a.chunks.flatMap((c) => c.modules).some((m) => /motion|store-selector/iu.test(m.id)),
    ).toBe(false);
    expect((await compileRelease(definition, join(dir, "a"))).candidateId).toBe(a.candidateId);
    const changed = { ...definition, locale: { default: "ja", supported: ["ja", "vi"] } };
    const c = await compileRelease(changed, join(dir, "a"));
    const output = execFileSync(
      join(root, ".venv/bin/python"),
      [
        "-c",
        'import sys,json,os;from pathlib import Path;from tools.compiler.local_publish import LocalPublisher;p=LocalPublisher(Path(sys.argv[1]));a=Path(sys.argv[2]);b=Path(sys.argv[3]);p.publish(a,0,os.getuid());p.publish(b,1,os.getuid());m=json.loads((a.parent.parent/"private"/a.name/"lrm.json").read_text());p.rollback(m["form"]["siteId"],m["form"]["formId"],a.name,2,os.getuid());print(json.dumps(p.active(m["form"]["siteId"],m["form"]["formId"])));p.close()',
        join(dir, "published"),
        a.directory,
        c.directory,
      ],
      { cwd: root, encoding: "utf8" },
    );
    expect(JSON.parse(output)).toMatchObject({ candidateId: a.candidateId, version: 3 });
    const verifyCandidate = () =>
      execFileSync(
        join(root, ".venv/bin/python"),
        [
          "-c",
          "import sys;from pathlib import Path;from tools.compiler.server_adapter import candidate;candidate(Path(sys.argv[1]))",
          a.directory,
        ],
        { cwd: root, stdio: "pipe" },
      );
    const lrm = readFileSync(join(privateDir, "lrm.json"));
    writeFileSync(join(privateDir, "lrm.json"), Buffer.concat([lrm, Buffer.from("\n")]));
    expect(verifyCandidate).toThrow();
    writeFileSync(join(privateDir, "lrm.json"), lrm);
    const attestation = readFileSync(join(privateDir, "attestation.json"));
    writeFileSync(join(privateDir, "attestation.json"), "{}");
    expect(verifyCandidate).toThrow();
    writeFileSync(join(privateDir, "attestation.json"), attestation);
    writeFileSync(join(a.directory, "index.html"), "corrupted");
    expect(() =>
      execFileSync(
        join(root, ".venv/bin/python"),
        [
          "-c",
          "import sys;from pathlib import Path;from tools.compiler.server_adapter import candidate;candidate(Path(sys.argv[1]))",
          a.directory,
        ],
        { cwd: root, stdio: "pipe" },
      ),
    ).toThrow();
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}, 30000);
