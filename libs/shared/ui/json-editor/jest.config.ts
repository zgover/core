/* eslint-disable */
module.exports = {
  displayName: 'shared-ui-json-editor',
  preset: '../../../../jest.preset.js',
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.[tj]sx?$': [
      '@swc/jest',
      // swcrc: false keeps the build-oriented .swcrc — which excludes spec
      // files — from being applied to the jest transform. Without it the
      // whole suite fails to run with "ignored by .swcrc" and reports zero
      // tests rather than a failure.
      { swcrc: false, jsc: { transform: { react: { runtime: 'automatic' } } } },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../../../coverage/libs/shared/ui/json-editor',
}
