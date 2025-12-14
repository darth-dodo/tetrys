# Test Coverage CI/CD Integration

This document describes the test coverage integration in the CI/CD pipeline for the Tetrys project.

## Overview

The project uses **Vitest** with **v8 coverage provider** to generate comprehensive test coverage reports. Coverage is automatically collected, validated, and reported on every push and pull request.

## Current Coverage Stats

- **Statements**: 82.46% ✅ (Target: 80%)
- **Lines**: 84.36% ✅ (Target: 80%)
- **Functions**: 82.6% ✅ (Target: 80%)
- **Branches**: 67.78% (Target: 80%)

**Total Tests**: 580 passing

## CI/CD Workflows

### 1. Main Deployment Workflow (`.github/workflows/deploy.yml`)

**Purpose**: Build, test with coverage, and deploy to production

**Triggers**:
- Push to `main` or `develop` branches
- Pull requests to `main`

**Coverage Steps**:
1. Run tests with coverage: `npm run test:coverage`
2. Upload coverage to Codecov
3. Archive coverage reports as artifacts (30-day retention)

**Artifacts**:
- Coverage reports stored for 30 days
- Accessible from GitHub Actions run summary

### 2. Test Coverage Workflow (`.github/workflows/test-coverage.yml`)

**Purpose**: Dedicated coverage reporting with PR comments

**Triggers**:
- Pull requests to `main` or `develop`
- Push to `main` or `develop`

**Coverage Steps**:
1. Run tests with coverage
2. Generate coverage summary in GitHub Actions summary
3. Upload coverage to Codecov
4. Post coverage comment on PR (with coverage diff)
5. Archive coverage artifacts
6. Validate coverage thresholds

**PR Comments**:
- Automatic coverage report on every PR
- Shows coverage changes (increase/decrease)
- Highlights uncovered lines

## Coverage Configuration

### Vitest Config (`vitest.config.ts`)

```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'json-summary', 'html', 'lcov'],
  exclude: [
    'node_modules/',
    'src/__tests__/',
    '**/*.d.ts',
    '**/*.config.*',
    '**/mockData',
    'dist/'
  ],
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

### Coverage Reports Generated

1. **text** - Console output during test run
2. **json** - Machine-readable coverage data (`coverage-final.json`)
3. **json-summary** - Summary statistics (`coverage-summary.json`)
4. **html** - Interactive HTML report (viewable in browser)
5. **lcov** - Standard coverage format for external tools (`lcov.info`)

## Local Development

### Running Coverage Locally

```bash
# Run tests with coverage
npm run test:coverage

# View HTML coverage report
open coverage/index.html
```

### Coverage Output Location

- **Reports**: `coverage/` directory (gitignored)
- **HTML Report**: `coverage/index.html`
- **LCOV**: `coverage/lcov.info`
- **JSON**: `coverage/coverage-final.json`
- **Summary**: `coverage/coverage-summary.json`

## Codecov Integration

### Setup Requirements

1. **Codecov Account**: Sign up at [codecov.io](https://codecov.io)
2. **GitHub Repository**: Connect your repository
3. **Codecov Token**: Add to GitHub Secrets as `CODECOV_TOKEN`

### Configuration

Codecov is configured to:
- Accept coverage from `coverage-final.json` and `lcov.info`
- Tag uploads with `unittests` flag
- Not fail CI if upload fails (`fail_ci_if_error: false`)
- Provide verbose output for debugging

### Codecov Features

- **Coverage Trends**: Track coverage over time
- **PR Comments**: Automatic coverage comments on PRs
- **Coverage Diff**: See coverage changes between branches
- **Sunburst Charts**: Visual coverage breakdown
- **File Browser**: Explore coverage by file

## Coverage Thresholds

### Current Thresholds (80%)

All thresholds set to **80%** in `vitest.config.ts`:
- ✅ Statements: 82.46%
- ✅ Lines: 84.36%
- ✅ Functions: 82.6%
- ⚠️ Branches: 67.78% (below threshold - expected for conditional logic)

### Threshold Enforcement

- **Local**: `npm run test:coverage` will fail if thresholds not met
- **CI/CD**: Pipeline fails if coverage drops below 80%
- **PRs**: Coverage changes visible in PR comments

## Test Coverage Breakdown

### By Composable

| Composable | Tests | Statements | Branches | Functions | Lines |
|------------|-------|------------|----------|-----------|-------|
| useSpeed | 25 | 95.45% | 100% | 100% | 95.45% |
| useAchievements | 155 | 93.1% | 62.5% | 96.29% | 93.39% |
| useAudio | 176 | 84.09% | 73.49% | 88.63% | 86.53% |
| useTheme | 35 | 100% | 100% | 100% | 100% |
| useTetris | 152 | 65.07% | 56.45% | 63.63% | 66.37% |

### By Category

- **Setup & Helpers**: 38 tests
- **Core Game Logic**: 152 tests
- **Audio System**: 176 tests
- **Achievements**: 155 tests
- **Theme System**: 35 tests
- **Speed Settings**: 25 tests

**Total**: 580 tests

## Maintenance

### Updating Coverage Badges

When coverage changes, update badges in `README.md`:

```markdown
[![Coverage](https://img.shields.io/badge/coverage-82.46%25-brightgreen)]()
[![Tests](https://img.shields.io/badge/tests-580%20passing-brightgreen)]()
```

### Adding New Tests

1. Write tests in `src/**/__tests__/` directories
2. Run `npm run test:coverage` locally
3. Verify coverage meets thresholds
4. Commit tests and updated coverage

### Coverage Troubleshooting

**Issue**: Coverage upload fails
- **Solution**: Check `CODECOV_TOKEN` in GitHub Secrets

**Issue**: Thresholds not met
- **Solution**: Add tests for uncovered code or adjust thresholds

**Issue**: Branch coverage low
- **Solution**: Add tests for conditional logic paths

## Best Practices

1. **Write Tests First**: Maintain coverage by writing tests for new code
2. **Check Coverage Locally**: Run `npm run test:coverage` before committing
3. **Review Coverage Reports**: Use HTML report to find untested code
4. **Meaningful Tests**: Don't just chase coverage numbers - write meaningful tests
5. **Test Edge Cases**: Ensure branches and edge cases are covered

## References

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Codecov Documentation](https://docs.codecov.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
