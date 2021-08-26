const { getJestProjects } = require('@nrwl/jest')

module.exports = {
  projects: [
    ...getJestProjects(),
    '<rootDir>/libs/shared/react-common',
    '<rootDir>/libs/shared/tools',
    '<rootDir>/libs/website/feature-website-core',
    '<rootDir>/libs/shared/featured-mdi-icons',
    '<rootDir>/libs/website/feature-react',
    '<rootDir>/libs/website/feature/react-builder',
    '<rootDir>/libs/website/feature/elements/material',
    '<rootDir>/libs/shared/util/logger',
    '<rootDir>/libs/shared/timestamp',
    '<rootDir>/libs/shared/util/error',
    '<rootDir>/libs/shared/feature/eventer',
  ],
}
