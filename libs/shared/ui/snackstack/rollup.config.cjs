/**
 * Custom rollup config that:
 * 1. Patches the NX dts-bundle plugin to use workspace-root-relative paths so
 *    the stub matches where TypeScript actually emits the declarations.
 * 2. Replaces the TypeScript plugin with one that has rootDir derived from
 *    __dirname (always accurate) rather than NX's workspaceRoot detection,
 *    which can resolve to the project directory on Vercel causing TS6059.
 */
const path = require('path');
const WORKSPACE_ROOT = path.resolve(__dirname, '../../../..');
const TSCONFIG_PATH = path.join(WORKSPACE_ROOT, 'libs/shared/ui/snackstack/tsconfig.lib.json');

function computeNxPaths() {
  try {
    const ts = require('typescript');
    const { readCachedProjectGraph } = require('@nx/devkit');
    const {
      calculateProjectBuildableDependencies,
      computeCompilerOptionsPaths,
    } = require('@nx/js/src/utils/buildable-libs-utils');

    const projectGraph = readCachedProjectGraph();
    const { dependencies } = calculateProjectBuildableDependencies(
      undefined,
      projectGraph,
      WORKSPACE_ROOT,
      'shared-ui-snackstack',
      process.env.NX_TASK_TARGET_TARGET || 'build',
      process.env.NX_TASK_TARGET_CONFIGURATION,
      true,
    );

    const tsConfigFile = ts.readConfigFile(TSCONFIG_PATH, ts.sys.readFile);
    const parsedTsConfig = ts.parseJsonConfigFileContent(
      tsConfigFile.config,
      ts.sys,
      path.dirname(TSCONFIG_PATH),
    );

    const paths = computeCompilerOptionsPaths(parsedTsConfig, dependencies);

    const pathsBase = parsedTsConfig.options.baseUrl || path.dirname(TSCONFIG_PATH);
    for (const key of Object.keys(paths)) {
      paths[key] = paths[key].map((p) => {
        if (path.isAbsolute(p)) return p;
        return path.resolve(pathsBase, p.startsWith('./') ? p.slice(2) : p);
      });
    }
    return paths;
  } catch {
    return undefined;
  }
}

function patchedDtsBundle() {
  return {
    name: 'dts-bundle',
    generateBundle(_opts, bundle) {
      for (const [, file] of Object.entries(bundle)) {
        if (file.type === 'asset' || !file.isEntry || file.facadeModuleId == null) {
          continue;
        }
        const hasDefaultExport = file.exports.includes('default');
        const entrySourceFileName = path
          .relative(WORKSPACE_ROOT, file.facadeModuleId)
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
  const dtsBundleIdx = (config.plugins || []).findIndex(
    (p) => p != null && p.name === 'dts-bundle',
  );
  if (dtsBundleIdx !== -1) {
    config.plugins[dtsBundleIdx] = patchedDtsBundle();
  }

  const tsIdx = (config.plugins || []).findIndex(
    (p) => p != null && p.name === 'typescript',
  );
  if (tsIdx !== -1) {
    const rollupOutputDir = Array.isArray(config.output)
      ? config.output[0]?.dir
      : config.output?.dir;
    const nxPaths = computeNxPaths();
    config.plugins[tsIdx] = require('@rollup/plugin-typescript')({
      tsconfig: TSCONFIG_PATH,
      compilerOptions: {
        rootDir: WORKSPACE_ROOT,
        declaration: true,
        emitDeclarationOnly: true,
        composite: false,
        outDir: rollupOutputDir,
        declarationDir: rollupOutputDir,
        noEmitOnError: true,
        ...(nxPaths ? { paths: nxPaths } : {}),
      },
    });
  }

  return config;
};
