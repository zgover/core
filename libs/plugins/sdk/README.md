# @aglyn/plugins-sdk

The SDK feature plugins build against: the `defineUiFeatureBundle` /
ConsoleExtension registration API and the sandboxed plugin iframe
protocol (`plugin-bridge`). Core libs must not import this package —
plugins extend the apps, the apps compose the plugins.
