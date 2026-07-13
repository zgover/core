import tseslint from 'typescript-eslint'

// Flat config (AGL-456), matching the workspace's eslint 9 convention.
export default tseslint.config(
  { ignores: ['lib/**', 'node_modules/**'] },
  ...tseslint.configs.recommended,
)
