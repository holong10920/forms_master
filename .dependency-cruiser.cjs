/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "motion-no-engine-or-tools",
      severity: "error",
      from: { path: "^packages/motion-adapter/src/" },
      to: { path: "^(packages/(form-engine|static-runtime)/|tools/|plugins/)" },
    },
    {
      name: "plugin-browser-no-host-or-server",
      severity: "error",
      from: { path: "^plugins/[^/]+/browser/" },
      to: { path: "(^packages/(form-engine|static-runtime)/|^tools/|/server/)" },
    },
    {
      name: "engine-no-presentation",
      severity: "error",
      from: { path: "^packages/form-engine/src/" },
      to: { path: "^packages/static-runtime/" },
    },
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
      from: {
        path: "^(packages/(contracts|form-engine|static-runtime|sdk-browser|motion-adapter|motion-presets)/src/|plugins/[^/]+/browser/)",
      },
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
