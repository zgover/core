/**
 * Rollup config plugin to suppress known non-fatal build log noise.
 *
 * Covers two categories of warnings that flood build logs and hide real errors:
 *
 * 1. MODULE_LEVEL_DIRECTIVE — emitted when bundling files with "use client" /
 *    "use server" directives (MUI, and library source files). Non-fatal but
 *    generates hundreds of events per build.
 *
 * 2. INVALID_ANNOTATION — emitted when a bundled dependency (e.g. react-virtuoso)
 *    has /* @__PURE__ *\/ comments in positions rollup cannot interpret. Non-fatal,
 *    but each warning spans multiple lines (~5 log events each).
 */
module.exports = function suppressRollupNoise(config) {
  const originalOnwarn = config.onwarn

  config.onwarn = function (warning, warn) {
    // Suppress "use client" and "use server" module directive warnings
    if (
      warning.code === 'MODULE_LEVEL_DIRECTIVE' &&
      warning.message &&
      (warning.message.includes('"use client"') ||
        warning.message.includes('"use server"'))
    ) {
      return
    }

    // Suppress @__PURE__ annotation position warnings from node_modules.
    // These come from packages like react-virtuoso that use tree-shaking
    // annotations in positions rollup cannot process. Completely non-fatal —
    // rollup removes the comment and continues bundling.
    if (
      warning.code === 'INVALID_ANNOTATION' &&
      warning.message &&
      warning.message.includes('node_modules')
    ) {
      return
    }

    if (originalOnwarn) {
      originalOnwarn(warning, warn)
    } else {
      warn(warning)
    }
  }

  return config
}
