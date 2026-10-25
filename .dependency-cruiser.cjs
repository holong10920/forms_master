/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "contracts-no-engine",
      severity: "error",
      from: { path: "^packages/contracts/" },
      to: { path: "^packages/form-engine/" },
    },
    { name: "no-circular", severity: "error", from: {}, to: { circular: true } },
    {
      name: "browser-safe-no-node",
      severity: "error",
      from: { path: "^packages/(contracts|form-engine)/src/" },
      to: { dependencyTypes: ["core"] },
    },
    {
      name: "src-no-test-fixture-script",
      severity: "error",
      from: { path: "^packages/[^/]+/src/" },
      to: { path: "/(test|tests|fixtures|scripts)/" },
    },
    {
      name: "no-relative-cross-package",
      severity: "error",
      from: { path: "^packages/([^/]+)/" },
      to: {
        path: "^packages/",
        pathNot: "^packages/$1/",
        dependencyTypes: ["local"],
        dependencyTypesNot: ["aliased"],
      },
    },
    {
      name: "packages-not-import-tools",
      severity: "error",
      from: { path: "^packages/" },
      to: { path: "^tools/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "^(spikes/|var/|tools/boundaries/fixtures/|tools/lint-fixtures/fixtures/)" },
    tsPreCompilationDeps: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "default", "node"],
    },
  },
};
