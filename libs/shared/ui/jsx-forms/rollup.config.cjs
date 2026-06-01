/**
 * Custom rollup config that patches the NX dts-bundle plugin.
 * See libs/shared/ui/jsx/rollup.config.cjs for the full explanation.
 *
 * Unlike shared-ui-jsx (which runs tsc to emit declarations), this package uses
 * skipTypeCheck:true so no tsc declarations are emitted into the dist. The stub
 * index.d.ts must therefore point directly to the workspace source file using a
 * relative path from the dist output directory back to the workspace root.
 */
const { workspaceRoot } = require('@nx/devkit');
const path = require('path');

function patchedDtsBundle() {
  return {
    name: 'dts-bundle',
    generateBundle(_opts, bundle) {
      for (const [, file] of Object.entries(bundle)) {
        if (file.type === 'asset' || !file.isEntry || file.facadeModuleId == null) {
          continue;
        }
        const hasDefaultExport = file.exports.includes('default');
        // Compute path relative to the output directory so the stub resolves
        // to the actual workspace source (not dist/…/libs/…/src/index which
        // doesn't exist when skipTypeCheck:true skips tsc declaration emit).
        const outputDir = path.resolve(workspaceRoot, _opts.dir || '');
        const entrySourceFileName = path
          .relative(outputDir, file.facadeModuleId)
          .replace(/\.[cm]?[jt]sx?$/, '');
        const dtsFileName = file.fileName.replace(
          /(\.cjs|\.mjs|\.esm\.js|\.cjs\.js|\.mjs\.js|\.js)$/,
          '.d.ts',
        );
        const ref = JSON.stringify('./' + entrySourceFileName);
        const dtsFileSource = hasDefaultExport
          ? `export * from ${ref};\nexport { default } from ${ref};\n`
          : `export * from ${ref};\n`;
        this.emitFile({ type: 'asset', fileName: dtsFileName, source: dtsFileSource });
      }
    },
  };
}

module.exports = function (config) {
  const idx = (config.plugins || []).findIndex(
    (p) => p != null && p.name === 'dts-bundle',
  );
  if (idx !== -1) {
    config.plugins[idx] = patchedDtsBundle();
  }
  return config;
};
