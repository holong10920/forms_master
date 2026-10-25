# JSON-Schema-Test-Suite (vendored subset)

- Source: https://github.com/json-schema-org/JSON-Schema-Test-Suite
- Commit: `89e83a74014617ffbe79a56d83d14d054cd11417` (main, 2026-10-21)
- Downloaded: 2026-10-25 from `raw.githubusercontent.com` at that commit. Files are unmodified.
- License: MIT (`LICENSE`, Copyright (c) 2012 Julian Berman).
- Dialect: `tests/draft2020-12/` only.

Subset = keyword allowlist of spec #1 §7.7: `type`, `properties`, `required`, `additionalProperties`,
`items`, `enum`, `const`, `minItems`, `maxItems`, `minLength`, `maxLength`, `minimum`, `maximum`,
`ref` (`$ref`), `defs` (`$defs`), `oneOf`. Groups in these files may also use other keywords; a run
of this subset is **not** a claim of full JSON Schema 2020-12 conformance.

`SKIPS.json` lists excluded tests (`{file, group, test|null, reason}`), shared by the TS and Python
runners. Allowed reasons only: needs a remote ref, needs metaschema validation, uses a keyword
outside the allowlist. A failing test is never skipped for any other reason.

`KNOWN_DIVERGENCES.json` lists Ajv 8.20.0 behaviours that differ from the suite (TS runner only).
Those tests are **not** skipped: they run as expected failures (`test.fails`), so an Ajv upgrade that
fixes one turns the run red for review. Each entry names its mitigation (schema lint rules in
`packages/contracts/scripts/lint-schemas.ts`). The Python runner has no divergences.

SHA-256 of vendored files:

```
837402bd25fad9b704265801ca3f92566a98157c1f9a7acd6f446299ba1c305a  LICENSE
b96bd533416386ac6421737b48c5c072870ab5dbea910585e9e8fa6305c7ca91  tests/draft2020-12/additionalProperties.json
83a148d2589cbd211e7e64b31763290f8869d763f513de4658e8d25f0fcc025e  tests/draft2020-12/const.json
5a352f0b1ad9aa906758fa4d363a77c4c4b29cfc193e8d6f7ab1e184be2a75d5  tests/draft2020-12/defs.json
1abe7eb883bde4a78c62f08e484e16f32b72ca5c1be725aa54d85cc4546b5031  tests/draft2020-12/enum.json
d924a8171f1f1d04ff026a4e3491d1376297145563158543005b7073b69ab913  tests/draft2020-12/items.json
59fa6236c0766aaac5fb7c9ef82e205c230efa94271485f614218291be7cbc5c  tests/draft2020-12/maxItems.json
ac43a3991586f2d2d1e7e37cad01bb1a7b1c5d9ad7b558d6029d24b41a04d1a9  tests/draft2020-12/maxLength.json
dfbc88ef4ede2966250fb2ad44076856d51481ea01ce679cca70efe47606ee90  tests/draft2020-12/maximum.json
9792cedc446be654836b42d0312eca12051e9e2f24cd5d95dcd3f3fc9adccd0a  tests/draft2020-12/minItems.json
999e9731c57a1296e06e8b9b36b0531614ab7a6ac3c20db6fed50badbf3850ab  tests/draft2020-12/minLength.json
f6a29cb574b76621da23636a636cf12cb31b01646b89543e6ce1a813376439a3  tests/draft2020-12/minimum.json
a8d80a786d07769cb9b8b9a8903ca4f7aa564446ae6b781c7f7f6ffea11ed363  tests/draft2020-12/oneOf.json
58f01566cfe3e1fc4fb851d3b2eab13768d65ba5dbc4e9f9387ceaf4244a0522  tests/draft2020-12/properties.json
ae53f3f57c220879729225eb416cecac909f06b5adaf15f799b4f3e7c0612998  tests/draft2020-12/ref.json
3e3900dd0e546c1cb4aaab6b24ea0e06a8f7f8c05b272dcc87e85332501ed42e  tests/draft2020-12/required.json
4c5cbe6cbcd28af73761091367b20e07d0403847e236c06c31fc27061bd81192  tests/draft2020-12/type.json
```
