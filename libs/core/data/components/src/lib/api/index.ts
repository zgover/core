export const aglynExtensionComonentsModule = () =>
  import('../models/aglyn-components.extension').then((m) => m.AglynComponentsExtension)

export * from './api'
