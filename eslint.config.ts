import antfu from '@antfu/eslint-config'
import oxlint from 'eslint-plugin-oxlint'

export default antfu(
  {
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-labels': 'off',
      'node/prefer-global/process': 'off',
    },
  },
  {
    ignores: ['.oxlintrc.json', 'dist/**/*', 'dist-type/**/*', '**/*.d.ts'],
  },
  ...oxlint.buildFromOxlintConfigFile('./.oxlintrc.json'),
)
