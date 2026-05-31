/**
 * Rollup config function that disables TypeScript diagnostics by patching
 * the @rollup/plugin-typescript plugin's buildStart hook to silence TS errors.
 */
module.exports = function skipTypecheckConfig(config) {
  if (!Array.isArray(config.plugins)) return config

  config.plugins = config.plugins.map((plugin) => {
    if (!plugin || plugin.name !== 'typescript') return plugin

    // Wrap the TypeScript plugin's buildStart to silence type errors
    const originalBuildStart = plugin.buildStart
    if (typeof originalBuildStart !== 'function') return plugin

    plugin.buildStart = async function (rollupOptions) {
      const origError = this.error.bind(this)
      this.error = function (err) {
        const msg = typeof err === 'string' ? err : (err && err.message) || ''
        // Silence TypeScript type-checking errors (TS followed by a number)
        if (/\[plugin typescript\].*TS\d+/.test(msg) || /TS\d+/.test(msg)) {
          this.warn(typeof err === 'string' ? { message: err, code: 'TS_TYPE_ERROR' } : err)
          return
        }
        origError(err)
      }.bind(this)
      return originalBuildStart.call(this, rollupOptions)
    }

    return plugin
  })

  return config
}
