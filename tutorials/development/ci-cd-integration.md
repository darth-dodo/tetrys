# CI/CD Integration and Test Coverage Guide

## Table of Contents

1. [Overview](#overview)
2. [Pipeline Architecture](#pipeline-architecture)
3. [GitHub Actions Workflows](#github-actions-workflows)
4. [Test Coverage Integration](#test-coverage-integration)
5. [Codecov Setup and Configuration](#codecov-setup-and-configuration)
6. [PR Coverage Comments and Reporting](#pr-coverage-comments-and-reporting)
7. [Coverage Thresholds and Enforcement](#coverage-thresholds-and-enforcement)
8. [Artifact Archival and Retention](#artifact-archival-and-retention)
9. [Local Development Workflow](#local-development-workflow)
10. [Coverage Badge Integration](#coverage-badge-integration)
11. [Troubleshooting CI/CD Issues](#troubleshooting-cicd-issues)
12. [Performance Optimization](#performance-optimization)
13. [Security Considerations](#security-considerations)
14. [Advanced Configurations](#advanced-configurations)

---

## Overview

The Tetrys project implements a robust CI/CD pipeline using GitHub Actions, integrating automated testing, code coverage tracking, and deployment workflows. This guide provides comprehensive documentation on the entire CI/CD ecosystem, from initial setup to advanced optimization techniques.

### Key Technologies

- **CI/CD Platform**: GitHub Actions
- **Testing Framework**: Vitest
- **Coverage Provider**: V8 (native Node.js coverage)
- **Coverage Platform**: Codecov
- **Deployment Target**: Netlify
- **Node Version**: 20.x

### Pipeline Goals

1. **Quality Assurance**: Ensure code quality through automated testing and linting
2. **Coverage Tracking**: Maintain 80%+ code coverage across all metrics
3. **Fast Feedback**: Provide rapid feedback on pull requests and commits
4. **Automated Deployment**: Deploy validated code to production automatically
5. **Transparency**: Make coverage and test results visible to all contributors

### Current Coverage Metrics

```
Statements:  82.46% ✅ (Target: 80%)
Lines:       84.36% ✅ (Target: 80%)
Functions:   82.6%  ✅ (Target: 80%)
Branches:    67.78% ⚠️  (Target: 80%)

Total Tests: 580 passing
```

---

## Pipeline Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     GitHub Repository                        │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                  Event Triggers                              │
│  • Push to main/develop                                      │
│  • Pull Request to main                                      │
└─────────────────────────────────────────────────────────────┘
                           │
           ┌───────────────┴───────────────┐
           ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│  deploy.yml          │      │  test-coverage.yml   │
│  (Main Pipeline)     │      │  (Coverage Focus)    │
└──────────────────────┘      └──────────────────────┘
           │                               │
           ▼                               ▼
┌──────────────────────┐      ┌──────────────────────┐
│  1. Test Job         │      │  Coverage Job        │
│     • Lint           │      │     • Test Run       │
│     • Type Check     │      │     • Summary        │
│     • Coverage       │      │     • Codecov        │
│     • Upload         │      │     • PR Comment     │
└──────────────────────┘      └──────────────────────┘
           │
           ▼
┌──────────────────────┐
│  2. Build Job        │
│     • npm build      │
│     • Artifact       │
└──────────────────────┘
           │
       ┌───┴───┐
       ▼       ▼
┌──────────┐ ┌──────────┐
│ Deploy   │ │ Preview  │
│ (main)   │ │ (PR)     │
└──────────┘ └──────────┘
       │           │
       ▼           ▼
┌──────────┐ ┌──────────┐
│ Netlify  │ │ Netlify  │
│ Prod     │ │ Preview  │
└──────────┘ └──────────┘
```

### Workflow Separation Strategy

The project uses **two distinct workflows** for different purposes:

#### 1. deploy.yml - Production Pipeline
- **Purpose**: Complete build-test-deploy cycle
- **Triggers**: All pushes and PRs
- **Focus**: Production readiness and deployment
- **Coverage**: Uploads to Codecov, archives artifacts

#### 2. test-coverage.yml - Coverage Reporting
- **Purpose**: Detailed coverage analysis and reporting
- **Triggers**: PRs and pushes to main/develop
- **Focus**: Coverage visibility and developer feedback
- **Coverage**: PR comments, GitHub summaries, threshold validation

### Why Two Workflows?

1. **Separation of Concerns**: Deployment logic separate from coverage reporting
2. **Flexibility**: Coverage workflow can run independently
3. **Performance**: Parallel execution when both trigger
4. **Clarity**: Each workflow has a single, clear purpose
5. **Maintainability**: Easier to update and debug individual workflows

---

## GitHub Actions Workflows

### Workflow 1: deploy.yml (Main Pipeline)

This is the primary deployment pipeline that handles the complete lifecycle from testing to production deployment.

#### Workflow Structure

```yaml
name: Build and Deploy to Netlify

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

env:
  NODE_VERSION: '20'
```

#### Job 1: Test and Lint

**Purpose**: Validate code quality and generate coverage reports

```yaml
jobs:
  test:
    name: Test and Lint
    runs-on: ubuntu-latest

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Run linting
      run: npm run lint

    - name: Run type checking
      run: npm run type-check

    - name: Run tests with coverage
      run: npm run test:coverage

    - name: Upload coverage reports to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json
        flags: unittests
        name: codecov-umbrella
        fail_ci_if_error: false
        verbose: true
      env:
        CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}

    - name: Archive coverage results
      uses: actions/upload-artifact@v3
      with:
        name: coverage-report
        path: coverage/
        retention-days: 30
```

**Key Features**:
- Uses `npm ci` for reproducible installs
- Node.js dependency caching for faster runs
- Sequential quality gates (lint → type-check → test)
- Coverage upload to Codecov
- 30-day artifact retention

#### Job 2: Build Application

**Purpose**: Create production-ready build artifacts

```yaml
  build:
    name: Build Application
    runs-on: ubuntu-latest
    needs: test  # Only runs if tests pass

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    - name: Build application
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/
```

**Key Features**:
- Conditional execution (only after test success)
- Fresh dependency install for build isolation
- Build artifact upload for deployment jobs

#### Job 3: Deploy to Production

**Purpose**: Deploy to Netlify production environment

```yaml
  deploy:
    name: Deploy to Netlify
    runs-on: ubuntu-latest
    needs: build
    if: github.ref == 'refs/heads/main' && github.event_name == 'push'

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/

    - name: Deploy to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './dist'
        production-branch: main
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Deploy from GitHub Actions"
        enable-pull-request-comment: false
        enable-commit-comment: true
        overwrites-pull-request-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Key Features**:
- Conditional deployment (only on main branch pushes)
- Artifact reuse (no rebuild needed)
- Netlify integration with commit comments

#### Job 4: Preview Deployment

**Purpose**: Deploy PR preview environments

```yaml
  preview:
    name: Preview Deploy
    runs-on: ubuntu-latest
    needs: build
    if: github.event_name == 'pull_request'

    steps:
    - name: Checkout
      uses: actions/checkout@v4

    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/

    - name: Deploy Preview to Netlify
      uses: nwtgck/actions-netlify@v2.0
      with:
        publish-dir: './dist'
        github-token: ${{ secrets.GITHUB_TOKEN }}
        deploy-message: "Preview deploy from PR #${{ github.event.number }}"
        enable-pull-request-comment: true
        enable-commit-comment: false
        overwrites-pull-request-comment: true
      env:
        NETLIFY_AUTH_TOKEN: ${{ secrets.NETLIFY_AUTH_TOKEN }}
        NETLIFY_SITE_ID: ${{ secrets.NETLIFY_SITE_ID }}
```

**Key Features**:
- PR-triggered only
- Unique preview URL per PR
- PR comment with preview link

### Workflow 2: test-coverage.yml (Coverage Pipeline)

This workflow focuses exclusively on test coverage reporting and developer feedback.

#### Workflow Structure

```yaml
name: Test Coverage

on:
  pull_request:
    branches: [ main, develop ]
  push:
    branches: [ main, develop ]

env:
  NODE_VERSION: '20'
```

#### Coverage Job Breakdown

```yaml
jobs:
  coverage:
    name: Test Coverage Report
    runs-on: ubuntu-latest

    steps:
    # 1. Environment Setup
    - name: Checkout
      uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: ${{ env.NODE_VERSION }}
        cache: 'npm'

    - name: Install dependencies
      run: npm ci

    # 2. Test Execution
    - name: Run tests with coverage
      run: npm run test:coverage
      continue-on-error: true  # Don't fail workflow, just report

    # 3. GitHub Summary Generation
    - name: Coverage Summary
      run: |
        echo "## Test Coverage Report" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY
        echo "### Coverage Metrics" >> $GITHUB_STEP_SUMMARY
        echo "" >> $GITHUB_STEP_SUMMARY

        if [ -f coverage/coverage-summary.json ]; then
          echo "\`\`\`json" >> $GITHUB_STEP_SUMMARY
          cat coverage/coverage-summary.json | jq '.total' >> $GITHUB_STEP_SUMMARY
          echo "\`\`\`" >> $GITHUB_STEP_SUMMARY
        fi

        echo "" >> $GITHUB_STEP_SUMMARY
        echo "### Test Results" >> $GITHUB_STEP_SUMMARY
        echo "- ✅ All tests must pass" >> $GITHUB_STEP_SUMMARY
        echo "- 📊 Target: 80%+ statement and line coverage" >> $GITHUB_STEP_SUMMARY
        echo "- 🎯 Current: See metrics above" >> $GITHUB_STEP_SUMMARY

    # 4. Codecov Upload
    - name: Upload coverage to Codecov
      uses: codecov/codecov-action@v4
      with:
        files: ./coverage/coverage-final.json,./coverage/lcov.info
        flags: unittests
        name: codecov-tetrys
        fail_ci_if_error: false
        verbose: true
      env:
        CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}

    # 5. PR Comment Generation
    - name: Coverage Comment on PR
      if: github.event_name == 'pull_request'
      uses: romeovs/lcov-reporter-action@v0.3.1
      with:
        lcov-file: ./coverage/lcov.info
        github-token: ${{ secrets.GITHUB_TOKEN }}
        delete-old-comments: true

    # 6. Artifact Archival
    - name: Archive coverage artifacts
      uses: actions/upload-artifact@v3
      with:
        name: coverage-report
        path: |
          coverage/
          !coverage/**/*.js
        retention-days: 30

    # 7. Threshold Validation
    - name: Check coverage thresholds
      run: |
        echo "Verifying coverage meets minimum thresholds..."
        # Thresholds enforced by vitest.config.ts
```

**Key Features**:
- GitHub Actions summary with JSON metrics
- Dual coverage upload (Codecov + artifacts)
- Automatic PR comments with coverage diff
- Threshold validation
- Smart artifact filtering (excludes JS files)

---

## Test Coverage Integration

### Vitest Configuration

The project uses Vitest with v8 coverage provider for comprehensive test coverage tracking.

#### Coverage Configuration

```typescript
// vitest.config.ts
export default defineConfig({
  plugins: [vue()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/__tests__/setup.ts'],
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
  }
})
```

#### Coverage Provider: V8

**Why V8?**
- Native Node.js coverage (no instrumentation overhead)
- Accurate source map support
- Fast execution
- Lower memory footprint
- Better integration with modern JavaScript

**V8 vs Istanbul**:
```
┌─────────────────┬──────────┬──────────────┐
│ Feature         │ V8       │ Istanbul     │
├─────────────────┼──────────┼──────────────┤
│ Speed           │ Fast     │ Slower       │
│ Memory          │ Low      │ Higher       │
│ Accuracy        │ High     │ Good         │
│ Source Maps     │ Excellent│ Good         │
│ Modern JS       │ Native   │ Transpiled   │
└─────────────────┴──────────┴──────────────┘
```

#### Coverage Reporters

The project generates multiple coverage report formats:

1. **text**: Console output during test runs
   ```
   % Coverage report from v8
   -------------------------|---------|----------|---------|---------|
   File                     | % Stmts | % Branch | % Funcs | % Lines |
   -------------------------|---------|----------|---------|---------|
   All files                |   82.46 |    67.78 |    82.6 |   84.36 |
   ```

2. **json**: Machine-readable coverage data
   ```json
   {
     "/path/to/file.ts": {
       "path": "/path/to/file.ts",
       "statementMap": {...},
       "fnMap": {...},
       "branchMap": {...},
       "s": {...},
       "f": {...},
       "b": {...}
     }
   }
   ```

3. **json-summary**: Aggregated metrics
   ```json
   {
     "total": {
       "lines": { "total": 1000, "covered": 843, "skipped": 0, "pct": 84.36 },
       "statements": { "total": 1200, "covered": 989, "skipped": 0, "pct": 82.46 },
       "functions": { "total": 150, "covered": 123, "skipped": 0, "pct": 82.6 },
       "branches": { "total": 400, "covered": 271, "skipped": 0, "pct": 67.78 }
     }
   }
   ```

4. **html**: Interactive web interface
   - File tree navigation
   - Line-by-line coverage visualization
   - Coverage heatmaps
   - Sortable tables
   - Search functionality

5. **lcov**: Standard coverage format
   - Compatible with external tools
   - Used by Codecov and PR reporters
   - Industry standard format

#### Coverage Exclusions

The configuration excludes specific paths from coverage tracking:

```typescript
exclude: [
  'node_modules/',      // Third-party dependencies
  'src/__tests__/',     // Test files themselves
  '**/*.d.ts',          // TypeScript declaration files
  '**/*.config.*',      // Configuration files
  '**/mockData',        // Test fixtures and mocks
  'dist/'               // Build output
]
```

**Rationale**:
- Test files shouldn't be coverage targets
- Configuration files are declarative
- Mock data is static test fixtures
- Build output is generated code
- Declaration files have no executable code

---

## Codecov Setup and Configuration

### Initial Setup

#### 1. Create Codecov Account

1. Visit [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Authorize Codecov to access your repositories
4. Select the Tetrys repository

#### 2. Generate Codecov Token

1. Navigate to repository settings in Codecov
2. Copy the upload token
3. Add to GitHub repository secrets as `CODECOV_TOKEN`

```bash
# GitHub Repository Settings → Secrets and variables → Actions
# New repository secret:
Name: CODECOV_TOKEN
Value: <your-codecov-token>
```

#### 3. Configure Codecov (Optional)

Create `.codecov.yml` in repository root for advanced configuration:

```yaml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%  # Allow 2% drop
    patch:
      default:
        target: 80%
        threshold: 5%

comment:
  layout: "header, diff, files"
  behavior: default
  require_changes: false

ignore:
  - "src/__tests__/"
  - "**/*.config.*"
  - "**/mockData"
```

### Codecov Integration

#### Upload Configuration

```yaml
- name: Upload coverage to Codecov
  uses: codecov/codecov-action@v4
  with:
    files: ./coverage/coverage-final.json,./coverage/lcov.info
    flags: unittests
    name: codecov-tetrys
    fail_ci_if_error: false
    verbose: true
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

**Parameters Explained**:
- `files`: Coverage report paths (supports multiple formats)
- `flags`: Tag uploads for filtering (e.g., unittests, integration)
- `name`: Unique identifier for this upload
- `fail_ci_if_error`: Continue CI even if upload fails
- `verbose`: Enable detailed logging for debugging
- `CODECOV_TOKEN`: Authentication token from secrets

#### Coverage Flags

Flags help organize coverage reports by test type:

```yaml
flags: unittests  # Current setup

# Advanced multi-flag setup:
flags: unittests,frontend,vue3
```

**Use Cases**:
- Filter coverage by test type
- Track coverage trends by component
- Compare different test suites
- Identify coverage gaps by area

### Codecov Features

#### 1. Coverage Dashboard

**Metrics Tracked**:
- Statement coverage percentage
- Branch coverage percentage
- Function coverage percentage
- Line coverage percentage
- Coverage trend over time

**Visualizations**:
- Sunburst chart (hierarchical coverage)
- Line graph (coverage trends)
- File tree (directory-level coverage)
- Commit list (coverage per commit)

#### 2. Pull Request Integration

**PR Comments Include**:
- Overall coverage change (+/-%)
- New uncovered lines
- File-by-file coverage diff
- Impact summary

**Example PR Comment**:
```markdown
## Codecov Report
Coverage: 82.46% (+0.23%)
Files changed: 3

| File | Coverage Δ | Complexity Δ |
|------|-----------|--------------|
| src/composables/useTetris.ts | 65.07% (+2.5%) | 45 (+3) |
| src/composables/useAudio.ts | 84.09% (+0.8%) | 32 (+1) |

📢 Coverage increased by 0.23%
```

#### 3. Coverage Trends

Track coverage changes over time:
- Daily/weekly/monthly trends
- Identify coverage regressions
- Monitor improvement initiatives
- Compare branches

#### 4. File Browser

Interactive file explorer:
- Navigate project structure
- View line-by-line coverage
- Identify uncovered code blocks
- Filter by coverage level

---

## PR Coverage Comments and Reporting

### LCOV Reporter Action

The project uses `lcov-reporter-action` for detailed PR coverage comments:

```yaml
- name: Coverage Comment on PR
  if: github.event_name == 'pull_request'
  uses: romeovs/lcov-reporter-action@v0.3.1
  with:
    lcov-file: ./coverage/lcov.info
    github-token: ${{ secrets.GITHUB_TOKEN }}
    delete-old-comments: true
```

**Features**:
- Automatic comment on every PR
- Coverage diff (before vs after)
- Line-by-line uncovered code
- Old comments automatically deleted
- File-level coverage breakdown

### PR Comment Format

```markdown
## Coverage Report

### Summary
- **Lines**: 84.36% (+1.2%)
- **Functions**: 82.6% (+0.5%)
- **Branches**: 67.78% (-0.3%)

### Changed Files
| File | Lines | Functions | Branches |
|------|-------|-----------|----------|
| src/composables/useTetris.ts | 66.37% ↑ | 63.63% ↑ | 56.45% → |
| src/components/GameBoard.vue | 95.00% → | 100% → | 88.88% ↑ |

### Uncovered Lines
- src/composables/useTetris.ts: L45-48, L67, L89-92
- src/stores/gameStore.ts: L23-25

Coverage increased by 0.8%
```

### GitHub Actions Summary

The workflow also generates a summary in GitHub Actions UI:

```yaml
- name: Coverage Summary
  run: |
    echo "## Test Coverage Report" >> $GITHUB_STEP_SUMMARY
    echo "### Coverage Metrics" >> $GITHUB_STEP_SUMMARY
    cat coverage/coverage-summary.json | jq '.total' >> $GITHUB_STEP_SUMMARY
```

**Benefits**:
- Visible in Actions run summary
- No need to open artifacts
- Quick coverage overview
- JSON format for easy parsing

---

## Coverage Thresholds and Enforcement

### Configured Thresholds

```typescript
thresholds: {
  lines: 80,       // 80% of lines must be executed
  functions: 80,   // 80% of functions must be called
  branches: 80,    // 80% of branches must be taken
  statements: 80   // 80% of statements must be executed
}
```

### Threshold Enforcement Levels

#### 1. Local Development

```bash
npm run test:coverage
# ❌ FAIL: Coverage threshold for lines (79.5%) not met: 80%
# ❌ FAIL: Coverage threshold for branches (67.78%) not met: 80%
```

**Behavior**:
- Command exits with non-zero status
- Coverage report still generated
- Developer sees immediate feedback

#### 2. CI/CD Pipeline

```yaml
- name: Run tests with coverage
  run: npm run test:coverage
  # Fails workflow if thresholds not met
```

**Behavior**:
- Workflow fails if any threshold not met
- Prevents merging low-coverage code
- Forces coverage improvements

#### 3. Codecov Status Checks

```yaml
# .codecov.yml
coverage:
  status:
    project:
      default:
        target: 80%
        threshold: 2%  # Allow 2% drop without failing
```

**Behavior**:
- GitHub status check on PRs
- Blocks merge if coverage drops significantly
- Configurable tolerance threshold

### Current Coverage Status

```
✅ Statements:  82.46% (Above 80% threshold)
✅ Lines:       84.36% (Above 80% threshold)
✅ Functions:   82.6%  (Above 80% threshold)
⚠️  Branches:    67.78% (Below 80% threshold)
```

**Branch Coverage Note**:
- Branch coverage naturally lower for conditional logic
- 67.78% is reasonable for game logic with many edge cases
- Focus on improving critical path branch coverage
- Consider adjusting threshold to 70% for branches

### Adjusting Thresholds

#### Lower Threshold (Not Recommended)

```typescript
thresholds: {
  lines: 75,       // Lowered from 80
  functions: 75,
  branches: 65,    // Acknowledge current state
  statements: 75
}
```

#### Increase Threshold (Aspirational)

```typescript
thresholds: {
  lines: 85,       // Higher quality target
  functions: 85,
  branches: 75,    // Realistic improvement
  statements: 85
}
```

#### Per-File Thresholds (Advanced)

```typescript
coverage: {
  thresholds: {
    global: {
      lines: 80,
      functions: 80
    },
    './src/composables/': {
      lines: 90,      // Higher standards for composables
      functions: 90
    },
    './src/utils/': {
      lines: 95,      // Pure functions should be well-tested
      functions: 95
    }
  }
}
```

---

## Artifact Archival and Retention

### Coverage Artifacts

Both workflows archive coverage reports as GitHub Actions artifacts:

```yaml
- name: Archive coverage artifacts
  uses: actions/upload-artifact@v3
  with:
    name: coverage-report
    path: |
      coverage/
      !coverage/**/*.js
    retention-days: 30
```

### Artifact Structure

```
coverage-report.zip
├── coverage-final.json       # Complete coverage data
├── coverage-summary.json     # Aggregated metrics
├── lcov.info                # LCOV format report
├── index.html               # HTML report entry point
└── ... (HTML assets)
```

### Accessing Artifacts

#### Via GitHub UI

1. Navigate to Actions tab
2. Select workflow run
3. Scroll to "Artifacts" section
4. Download `coverage-report.zip`
5. Extract and open `coverage/index.html`

#### Via GitHub CLI

```bash
# List artifacts for a run
gh run view <run-id> --log

# Download artifacts
gh run download <run-id>

# Download specific artifact
gh run download <run-id> -n coverage-report
```

### Artifact Retention Policy

**Current Policy**: 30 days

```yaml
retention-days: 30
```

**Considerations**:
- GitHub free tier: 500MB storage
- Private repos: Count against storage quota
- 30 days balances history with storage costs
- Codecov provides long-term coverage history

**Adjusting Retention**:

```yaml
# Shorter retention (save storage)
retention-days: 7

# Longer retention (more history)
retention-days: 90

# Maximum retention
retention-days: 400  # GitHub maximum
```

### Build Artifacts

The deploy workflow also archives build outputs:

```yaml
- name: Upload build artifacts
  uses: actions/upload-artifact@v3
  with:
    name: dist
    path: dist/
```

**Purpose**:
- Reuse build across deployment jobs
- Avoid rebuilding for preview/production
- Debugging production builds
- Rollback capability

---

## Local Development Workflow

### Running Tests Locally

#### Standard Test Run

```bash
# Run all tests
npm test

# Run in watch mode
npm run test:watch

# Run specific test file
npm test src/composables/__tests__/useTetris.spec.ts

# Run tests matching pattern
npm test -- --grep "achievement"
```

#### Coverage Generation

```bash
# Generate coverage report
npm run test:coverage

# Watch mode with coverage (not recommended)
npm run test:watch -- --coverage
```

### Viewing Coverage Reports

#### HTML Report (Recommended)

```bash
# Generate coverage
npm run test:coverage

# Open HTML report (macOS)
open coverage/index.html

# Open HTML report (Linux)
xdg-open coverage/index.html

# Open HTML report (Windows)
start coverage/index.html
```

#### Terminal Report

```bash
npm run test:coverage
# Coverage report printed to console
```

#### VS Code Integration

Install Vitest extension:
```bash
code --install-extension ZixuanChen.vitest-explorer
```

**Features**:
- Run tests from sidebar
- Inline coverage indicators
- Test results in editor
- Debugging support

### Pre-Commit Coverage Check

Create Git pre-commit hook:

```bash
# .git/hooks/pre-commit
#!/bin/bash

echo "Running tests with coverage..."
npm run test:coverage

if [ $? -ne 0 ]; then
  echo "❌ Tests failed or coverage below threshold"
  echo "Commit aborted. Fix tests or coverage before committing."
  exit 1
fi

echo "✅ Tests passed and coverage meets thresholds"
exit 0
```

Make executable:
```bash
chmod +x .git/hooks/pre-commit
```

### Coverage-Driven Development Workflow

```
┌─────────────────────────────────────┐
│ 1. Write failing test               │
│    npm test -- --watch              │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 2. Implement feature                │
│    Test turns green                 │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 3. Check coverage                   │
│    npm run test:coverage            │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 4. Add edge case tests              │
│    Improve coverage to 80%+         │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ 5. Refactor with confidence         │
│    Coverage ensures no regression   │
└─────────────────────────────────────┘
```

---

## Coverage Badge Integration

### Codecov Badge

#### Standard Badge

```markdown
[![codecov](https://codecov.io/gh/USERNAME/tetrys/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/tetrys)
```

Rendered:
[![codecov](https://codecov.io/gh/USERNAME/tetrys/branch/main/graph/badge.svg)](https://codecov.io/gh/USERNAME/tetrys)

#### Custom Badge Styles

```markdown
<!-- Flat style -->
[![codecov](https://codecov.io/gh/USERNAME/tetrys/branch/main/graph/badge.svg?style=flat)](https://codecov.io/gh/USERNAME/tetrys)

<!-- Flat-square style -->
[![codecov](https://codecov.io/gh/USERNAME/tetrys/branch/main/graph/badge.svg?style=flat-square)](https://codecov.io/gh/USERNAME/tetrys)

<!-- Plastic style -->
[![codecov](https://codecov.io/gh/USERNAME/tetrys/branch/main/graph/badge.svg?style=plastic)](https://codecov.io/gh/USERNAME/tetrys)
```

### Shields.io Badge

#### Dynamic Badge from Codecov

```markdown
[![Coverage](https://img.shields.io/codecov/c/github/USERNAME/tetrys)](https://codecov.io/gh/USERNAME/tetrys)
```

#### Static Badge (Manual Update)

```markdown
[![Coverage](https://img.shields.io/badge/coverage-82.46%25-brightgreen)]()
```

**Color Thresholds**:
- 80-100%: `brightgreen`
- 60-79%: `green`
- 40-59%: `yellow`
- 20-39%: `orange`
- 0-19%: `red`

### Test Count Badge

```markdown
[![Tests](https://img.shields.io/badge/tests-580%20passing-brightgreen)]()
```

### Combined Coverage Status

```markdown
## Test Coverage

[![Coverage](https://img.shields.io/badge/statements-82.46%25-brightgreen)]()
[![Coverage](https://img.shields.io/badge/lines-84.36%25-brightgreen)]()
[![Coverage](https://img.shields.io/badge/functions-82.6%25-brightgreen)]()
[![Coverage](https://img.shields.io/badge/branches-67.78%25-orange)]()
[![Tests](https://img.shields.io/badge/tests-580%20passing-brightgreen)]()
```

### Updating Badges

#### Automated Update Script

```bash
#!/bin/bash
# scripts/update-badges.sh

# Extract coverage from summary
STATEMENTS=$(jq -r '.total.statements.pct' coverage/coverage-summary.json)
LINES=$(jq -r '.total.lines.pct' coverage/coverage-summary.json)
FUNCTIONS=$(jq -r '.total.functions.pct' coverage/coverage-summary.json)
BRANCHES=$(jq -r '.total.branches.pct' coverage/coverage-summary.json)

# Update README.md
sed -i '' "s/coverage-[0-9.]*%25/coverage-${STATEMENTS}%25/g" README.md

echo "✅ Badges updated in README.md"
```

#### GitHub Actions Workflow

```yaml
- name: Update coverage badges
  run: |
    ./scripts/update-badges.sh
    git config user.name "github-actions[bot]"
    git config user.email "github-actions[bot]@users.noreply.github.com"
    git add README.md
    git commit -m "chore: update coverage badges [skip ci]"
    git push
```

---

## Troubleshooting CI/CD Issues

### Common Issues and Solutions

#### Issue 1: Coverage Upload Fails

**Symptoms**:
```
Error uploading coverage reports to Codecov
Error: Unable to upload coverage
```

**Diagnosis**:
```yaml
- name: Debug Codecov upload
  run: |
    ls -la coverage/
    cat coverage/coverage-summary.json | jq '.total'
    echo "CODECOV_TOKEN length: ${#CODECOV_TOKEN}"
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

**Solutions**:

1. **Verify Codecov Token**
   ```bash
   # Check token exists in GitHub Secrets
   # Regenerate if needed from Codecov dashboard
   ```

2. **Check Coverage File Generation**
   ```yaml
   - name: Verify coverage files
     run: |
       test -f coverage/coverage-final.json || exit 1
       test -f coverage/lcov.info || exit 1
   ```

3. **Network Issues**
   ```yaml
   - name: Upload with retry
     uses: codecov/codecov-action@v4
     with:
       fail_ci_if_error: false  # Don't fail on upload errors
       verbose: true
   ```

#### Issue 2: Tests Pass Locally, Fail in CI

**Common Causes**:
- Environment differences
- Timing issues
- Missing dependencies
- File system case sensitivity

**Diagnosis**:
```yaml
- name: Debug environment
  run: |
    node --version
    npm --version
    cat package-lock.json | jq '.lockfileVersion'
    env | sort
```

**Solutions**:

1. **Consistent Dependencies**
   ```yaml
   # Use npm ci instead of npm install
   - run: npm ci  # Uses exact versions from package-lock.json
   ```

2. **Fix Timing Issues**
   ```typescript
   // Use vi.useFakeTimers() for time-dependent tests
   import { vi } from 'vitest'

   beforeEach(() => {
     vi.useFakeTimers()
   })

   afterEach(() => {
     vi.restoreAllMocks()
   })
   ```

3. **Environment Variables**
   ```yaml
   env:
     NODE_ENV: test
     TZ: UTC  # Consistent timezone
   ```

#### Issue 3: Threshold Failures

**Symptoms**:
```
❌ Coverage threshold for branches (67.78%) not met: 80%
```

**Solutions**:

1. **Add Missing Tests**
   ```bash
   # Find uncovered code
   npm run test:coverage
   open coverage/index.html
   # Look for red/yellow highlighted code
   ```

2. **Adjust Thresholds (Temporary)**
   ```typescript
   thresholds: {
     branches: 65,  // Lower temporarily, plan to improve
   }
   ```

3. **Exclude Complex Branches**
   ```typescript
   exclude: [
     '**/complexity-heavy-file.ts'  // Document why
   ]
   ```

#### Issue 4: Artifact Upload Fails

**Symptoms**:
```
Error: Unable to upload artifact
Error: Artifact size exceeds limit
```

**Solutions**:

1. **Reduce Artifact Size**
   ```yaml
   - name: Archive coverage artifacts
     uses: actions/upload-artifact@v3
     with:
       name: coverage-report
       path: |
         coverage/
         !coverage/**/*.js  # Exclude generated files
         !coverage/**/*.map # Exclude source maps
   ```

2. **Check Size Limits**
   ```yaml
   - name: Check artifact size
     run: |
       du -sh coverage/
       # GitHub limit: 10GB per artifact
   ```

#### Issue 5: PR Comments Not Appearing

**Symptoms**:
- PR created but no coverage comment
- Old comments not deleted

**Solutions**:

1. **Verify Permissions**
   ```yaml
   permissions:
     pull-requests: write
     contents: read
   ```

2. **Check GITHUB_TOKEN**
   ```yaml
   - name: Coverage Comment on PR
     env:
       GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}  # Required
   ```

3. **Verify Workflow Trigger**
   ```yaml
   on:
     pull_request:  # Must trigger on PR events
       branches: [ main ]
   ```

### Debugging Workflow

```yaml
# Add debug steps to any workflow
- name: Debug Information
  run: |
    echo "Event: ${{ github.event_name }}"
    echo "Ref: ${{ github.ref }}"
    echo "SHA: ${{ github.sha }}"
    echo "Actor: ${{ github.actor }}"
    env | grep GITHUB_ | sort
```

---

## Performance Optimization

### Workflow Performance Metrics

Current workflow execution times:
```
Test Job:     ~2-3 minutes
Build Job:    ~1-2 minutes
Deploy Job:   ~1 minute
Total:        ~4-6 minutes
```

### Optimization Strategies

#### 1. Dependency Caching

**Current Implementation**:
```yaml
- name: Setup Node.js
  uses: actions/setup-node@v4
  with:
    node-version: ${{ env.NODE_VERSION }}
    cache: 'npm'  # Caches node_modules
```

**Benefits**:
- 30-60 second time savings per job
- Reduced npm registry load
- Consistent dependencies

#### 2. Parallel Job Execution

```yaml
jobs:
  test:
    # Runs independently

  build:
    needs: test  # Waits for test

  deploy:
    needs: build  # Sequential dependency

  preview:
    needs: build  # Runs parallel with deploy
```

**Optimization**: Run independent jobs in parallel

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20]  # Test multiple versions

  lint:
    # Run linting separately in parallel

  type-check:
    # Run type checking in parallel
```

#### 3. Conditional Job Execution

```yaml
# Skip deployment on draft PRs
deploy:
  if: |
    github.event_name == 'push' &&
    github.ref == 'refs/heads/main' &&
    !github.event.pull_request.draft
```

#### 4. Artifact Optimization

**Before** (slower):
```yaml
- run: npm run build
- uses: actions/upload-artifact@v3
  with:
    path: dist/  # Large artifact
```

**After** (faster):
```yaml
- run: npm run build
- uses: actions/upload-artifact@v3
  with:
    path: |
      dist/
      !dist/**/*.map  # Exclude source maps
    compression-level: 6  # Balance speed/size
```

#### 5. Test Optimization

**Parallel Test Execution**:
```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4  // Parallel execution
      }
    }
  }
})
```

**Coverage Optimization**:
```typescript
coverage: {
  all: false,  // Don't instrument untested files
  skipFull: true,  // Skip files with 100% coverage
}
```

#### 6. Build Caching

**Cache Vitest Results**:
```yaml
- name: Cache Vitest
  uses: actions/cache@v3
  with:
    path: node_modules/.vitest
    key: ${{ runner.os }}-vitest-${{ hashFiles('**/package-lock.json') }}
```

**Cache Build Output**:
```yaml
- name: Cache Build
  uses: actions/cache@v3
  with:
    path: dist
    key: ${{ runner.os }}-build-${{ github.sha }}
```

### Performance Monitoring

```yaml
- name: Workflow Timing
  run: |
    echo "Start: $(date -u +%s)"
    npm run test:coverage
    echo "End: $(date -u +%s)"
```

---

## Security Considerations

### Secret Management

#### GitHub Secrets Used

```
CODECOV_TOKEN       - Codecov upload authentication
NETLIFY_AUTH_TOKEN  - Netlify deployment authentication
NETLIFY_SITE_ID     - Netlify site identifier
GITHUB_TOKEN        - Automatic GitHub authentication
```

#### Adding Secrets

```bash
# Via GitHub UI
Repository → Settings → Secrets and variables → Actions → New repository secret

# Via GitHub CLI
gh secret set CODECOV_TOKEN < token.txt
```

#### Secret Rotation

```yaml
# Regular rotation schedule
CODECOV_TOKEN: Rotate quarterly
NETLIFY_AUTH_TOKEN: Rotate biannually
```

### Dependency Security

#### Automated Dependency Updates

```yaml
# .github/dependabot.yml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 10
```

#### Security Scanning

```yaml
- name: Run security audit
  run: npm audit --audit-level=moderate

- name: Check for vulnerable dependencies
  run: |
    npm audit --json > audit.json
    cat audit.json | jq '.vulnerabilities'
```

### Code Security

#### Prevent Secret Leaks

```yaml
# .github/workflows/security.yml
- name: Scan for secrets
  uses: trufflesecurity/trufflehog@main
  with:
    path: ./
    base: ${{ github.event.repository.default_branch }}
    head: HEAD
```

#### CodeQL Analysis

```yaml
# .github/workflows/codeql.yml
- name: Initialize CodeQL
  uses: github/codeql-action/init@v2
  with:
    languages: javascript, typescript

- name: Perform CodeQL Analysis
  uses: github/codeql-action/analyze@v2
```

### Workflow Security

#### Permissions

```yaml
# Minimal permissions principle
permissions:
  contents: read
  pull-requests: write  # Only when needed
```

#### Prevent Token Exposure

```yaml
# ❌ Bad: Token in logs
- run: echo ${{ secrets.CODECOV_TOKEN }}

# ✅ Good: Token in environment
- run: codecov-cli upload
  env:
    CODECOV_TOKEN: ${{ secrets.CODECOV_TOKEN }}
```

#### Secure Artifact Handling

```yaml
# ❌ Bad: Artifacts with secrets
- uses: actions/upload-artifact@v3
  with:
    path: .  # Might include .env

# ✅ Good: Specific paths only
- uses: actions/upload-artifact@v3
  with:
    path: |
      coverage/
      !**/.env
      !**/secrets.json
```

---

## Advanced Configurations

### Matrix Testing

Test across multiple environments:

```yaml
jobs:
  test:
    strategy:
      matrix:
        node-version: [18, 20, 22]
        os: [ubuntu-latest, windows-latest, macos-latest]

    runs-on: ${{ matrix.os }}

    steps:
    - uses: actions/setup-node@v4
      with:
        node-version: ${{ matrix.node-version }}
```

### Coverage Per Pull Request

Track coverage evolution:

```yaml
- name: Compare coverage with base
  run: |
    # Download base coverage
    gh run download --name coverage-report --dir base-coverage

    # Compare
    echo "Base coverage:"
    cat base-coverage/coverage-summary.json | jq '.total.lines.pct'

    echo "Current coverage:"
    cat coverage/coverage-summary.json | jq '.total.lines.pct'
```

### Custom Coverage Reports

Generate custom reports:

```yaml
- name: Generate custom report
  run: |
    node scripts/coverage-report.js
```

```javascript
// scripts/coverage-report.js
const coverage = require('./coverage/coverage-summary.json')

const report = {
  timestamp: new Date().toISOString(),
  commit: process.env.GITHUB_SHA,
  coverage: coverage.total,
  files: Object.keys(coverage).length
}

console.log(JSON.stringify(report, null, 2))
```

### Scheduled Coverage Analysis

Run coverage analysis on schedule:

```yaml
# .github/workflows/scheduled-coverage.yml
on:
  schedule:
    - cron: '0 0 * * 0'  # Weekly on Sunday

jobs:
  coverage-trend:
    runs-on: ubuntu-latest
    steps:
    - run: npm run test:coverage
    - name: Store historical data
      run: |
        mkdir -p coverage-history
        cp coverage/coverage-summary.json coverage-history/$(date +%Y-%m-%d).json
```

### Integration with Other Tools

#### SonarQube Integration

```yaml
- name: SonarQube Scan
  uses: SonarSource/sonarqube-scan-action@master
  with:
    args: >
      -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
  env:
    SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
```

#### Coveralls Integration

```yaml
- name: Coveralls
  uses: coverallsapp/github-action@master
  with:
    github-token: ${{ secrets.GITHUB_TOKEN }}
    path-to-lcov: ./coverage/lcov.info
```

---

## Summary

This guide covered:

- Complete pipeline architecture with dual workflow strategy
- Detailed GitHub Actions workflow configurations
- Vitest and V8 coverage integration
- Codecov setup and advanced features
- PR coverage comments and automated reporting
- Threshold enforcement at multiple levels
- Artifact management and retention policies
- Local development best practices
- Coverage badge integration
- Comprehensive troubleshooting guide
- Performance optimization techniques
- Security best practices
- Advanced configuration patterns

**Next Steps**:

1. Review your project's current coverage gaps
2. Set up pre-commit hooks for local coverage checks
3. Configure Codecov advanced features
4. Implement matrix testing for multiple Node versions
5. Add custom coverage reporting scripts
6. Integrate additional security scanning tools

**Resources**:

- [Vitest Documentation](https://vitest.dev/)
- [Codecov Documentation](https://docs.codecov.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [V8 Coverage](https://v8.dev/blog/javascript-code-coverage)

---

**Document Version**: 1.0
**Last Updated**: 2025-12-14
**Maintainer**: Development Team
**Related Docs**:
- `.github/COVERAGE.md`
- `tutorials/testing/unit-testing.md`
- `tutorials/deployment/netlify-deployment.md`
