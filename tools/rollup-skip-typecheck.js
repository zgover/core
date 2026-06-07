/**
 * Rollup config function that disables TypeScript diagnostics by patching
 * the @rollup/plugin-typescript plugin's buildStart and generateBundle hooks
 * to silence TS errors and suppress TS6059 rootDir warnings.
 *
 * TS6059 warnings occur because cross-library TypeScript source imports
 * (e.g. via `export * from '@aglyn/shared-data-mdi'`) pull in files that
 * are outside the TypeScript plugin's computed rootDir. These are non-fatal
 * warnings (noEmitOnError is false) but they flood build logs. Suppressing
 * them here makes actual build failures visible.
 */
module.exports = function skipTypecheckConfig(config) {
  if (!Array.isArray(config.plugins)) return config

  config.plugins = config.plugins.map((plugin) => {
    if (!plugin || plugin.name !== 'typescript') return plugin

    // Helper: wrap a hook function to intercept context.error and context.warn
    function wrapHook(originalHook, suppressWarnPattern) {
      return async function (...args) {
        const origError = this.error.bind(this)
        const origWarn = this.warn.bind(this)

        // Silence TypeScript type-checking errors (TS followed by a number)
        this.error = function (err) {
          const msg = typeof err === 'string' ? err : (err && err.message) || ''
          if (/\[plugin typescript\].*TS\d+/.test(msg) || /TS\d+/.test(msg)) {
            origWarn(typeof err === 'string' ? { message: err, code: 'TS_TYPE_ERROR' } : err)
            return
          }
          origError(err)
        }.bind(this)

        // Suppress specific TS warning patterns (e.g. TS6059 rootDir noise)
        if (suppressWarnPattern) {
          this.warn = function (err) {
            const msg = typeof err === 'string' ? err : (err && err.message) || ''
            if (suppressWarnPattern.test(msg)) return
            origWarn(err)
          }.bind(this)
        }

        return originalHook.call(this, ...args)
      }
    }

    // Wrap buildStart to silence TypeScript type errors
    if (typeof plugin.buildStart === 'function') {
      plugin.buildStart = wrapHook(plugin.buildStart, null)
    }

    // Wrap generateBundle to suppress TS6059 rootDir warnings.
    // TS6059 fires when cross-library source imports (pulled in through tsconfig
    // paths) fall outside the TypeScript plugin's effective rootDir. With
    // noEmitOnError:false these are non-fatal but extremely noisy (~3000 lines
    // for the MDI icon library), which hides actual build errors in logs.
    if (typeof plugin.generateBundle === 'function') {
      plugin.generateBundle = wrapHook(plugin.generateBundle, /TS6059/)
    }

    return plugin
  })

  return config
}
