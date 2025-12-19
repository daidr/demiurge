import type { GitHooksConfig } from 'bun-git-hooks'

const config: GitHooksConfig = {
  'pre-commit': 'bunx lint-staged',
  'commit-msg': 'bunx commitlint --edit $1',
  'verbose': false,
} as GitHooksConfig

export default config
