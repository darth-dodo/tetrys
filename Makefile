# Tetrys - Mobile Responsive Retro Tetris
# Makefile for development, testing, and deployment workflows

# Variables
NODE_BIN := node_modules/.bin
NPM := npm
NETLIFY := netlify
DIST_DIR := dist
VITE_CACHE := .vite
NODE_MODULES := node_modules

# Colors for output
BLUE := \033[0;34m
GREEN := \033[0;32m
YELLOW := \033[0;33m
RED := \033[0;31m
NC := \033[0m # No Color

.PHONY: help
help: ## Show this help message
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║            Tetrys - Development Makefile                 ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  $(YELLOW)%-20s$(NC) %s\n", $$1, $$2}'
	@echo ""
	@echo "$(BLUE)Usage Examples:$(NC)"
	@echo "  $(YELLOW)make dev$(NC)                  - Start development server"
	@echo "  $(YELLOW)make build$(NC)                - Build for production"
	@echo "  $(YELLOW)make quality$(NC)              - Run all quality checks"
	@echo "  $(YELLOW)make deploy-netlify$(NC)       - Deploy to Netlify"
	@echo "  $(YELLOW)make worktree-create BRANCH=fix-bug$(NC) - Create new worktree"
	@echo ""

.DEFAULT_GOAL := help

# ═══════════════════════════════════════════════════════════
# Development Commands
# ═══════════════════════════════════════════════════════════

.PHONY: install
install: ## [Dev] Install npm dependencies
	@echo "$(BLUE)📦 Installing dependencies...$(NC)"
	@$(NPM) install
	@echo "$(GREEN)✓ Dependencies installed successfully$(NC)"

.PHONY: dev
dev: ## [Dev] Start Vite development server
	@echo "$(BLUE)🚀 Starting development server...$(NC)"
	@$(NPM) run dev

.PHONY: dev-port
dev-port: ## [Dev] Start dev server on custom port (make dev-port PORT=3000)
	@echo "$(BLUE)🚀 Starting development server on port $(PORT)...$(NC)"
	@$(NPM) run dev -- --port $(PORT)

.PHONY: build
build: ## [Dev] Build for production
	@echo "$(BLUE)🔨 Building for production...$(NC)"
	@$(NPM) run build
	@echo "$(GREEN)✓ Build complete! Output in $(DIST_DIR)/$(NC)"

.PHONY: build-type-check
build-type-check: ## [Dev] Build with TypeScript type checking
	@echo "$(BLUE)🔨 Building with type checking...$(NC)"
	@$(NPM) run build:type-check
	@echo "$(GREEN)✓ Build complete with type checking!$(NC)"

.PHONY: preview
preview: ## [Dev] Preview production build locally
	@echo "$(BLUE)👀 Starting preview server...$(NC)"
	@$(NPM) run preview

# ═══════════════════════════════════════════════════════════
# Testing & Quality
# ═══════════════════════════════════════════════════════════

.PHONY: test
test: ## [Test] Run all tests
	@echo "$(BLUE)🧪 Running tests...$(NC)"
	@$(NPM) run test

.PHONY: test-watch
test-watch: ## [Test] Run tests in watch mode
	@echo "$(BLUE)🧪 Running tests in watch mode...$(NC)"
	@$(NPM) run test -- --watch

.PHONY: test-coverage
test-coverage: ## [Test] Run tests with coverage report
	@echo "$(BLUE)🧪 Running tests with coverage...$(NC)"
	@$(NPM) run test -- --coverage
	@echo "$(GREEN)✓ Coverage report generated$(NC)"

.PHONY: lint
lint: ## [Test] Run ESLint with auto-fix
	@echo "$(BLUE)🔍 Linting code...$(NC)"
	@$(NPM) run lint
	@echo "$(GREEN)✓ Linting complete$(NC)"

.PHONY: type-check
type-check: ## [Test] Run TypeScript type checking
	@echo "$(BLUE)📘 Type checking...$(NC)"
	@$(NPM) run type-check
	@echo "$(GREEN)✓ Type checking complete$(NC)"

.PHONY: quality
quality: lint type-check test ## [Test] Run all quality checks (lint + type-check + test)
	@echo "$(GREEN)✓ All quality checks passed!$(NC)"

# ═══════════════════════════════════════════════════════════
# Deployment
# ═══════════════════════════════════════════════════════════

.PHONY: deploy-netlify
deploy-netlify: build ## [Deploy] Build and deploy to Netlify production
	@echo "$(BLUE)🚀 Deploying to Netlify...$(NC)"
	@$(NETLIFY) deploy --prod --dir=$(DIST_DIR)
	@echo "$(GREEN)✓ Deployment complete!$(NC)"

.PHONY: deploy-preview
deploy-preview: build ## [Deploy] Create Netlify preview deployment
	@echo "$(BLUE)🚀 Creating preview deployment...$(NC)"
	@$(NETLIFY) deploy --dir=$(DIST_DIR)
	@echo "$(GREEN)✓ Preview deployment created!$(NC)"

.PHONY: build-deploy
build-deploy: quality build deploy-netlify ## [Deploy] Full pipeline: quality checks + build + deploy
	@echo "$(GREEN)✓ Complete deployment pipeline finished!$(NC)"

# ═══════════════════════════════════════════════════════════
# Git Workflow
# ═══════════════════════════════════════════════════════════

.PHONY: worktree-create
worktree-create: ## [Git] Create new worktree (make worktree-create BRANCH=feature-name)
	@if [ -z "$(BRANCH)" ]; then \
		echo "$(RED)❌ Error: BRANCH not specified$(NC)"; \
		echo "$(YELLOW)Usage: make worktree-create BRANCH=feature-name$(NC)"; \
		exit 1; \
	fi
	@echo "$(BLUE)🌿 Creating worktree for branch $(BRANCH)...$(NC)"
	@git worktree add -b $(BRANCH) ../tetrys-$(BRANCH)
	@echo "$(GREEN)✓ Worktree created at ../tetrys-$(BRANCH)$(NC)"

.PHONY: worktree-list
worktree-list: ## [Git] List all git worktrees
	@echo "$(BLUE)📋 Active worktrees:$(NC)"
	@git worktree list

.PHONY: worktree-clean
worktree-clean: ## [Git] Remove all worktrees except main
	@echo "$(BLUE)🧹 Cleaning up worktrees...$(NC)"
	@git worktree list | grep -v "$(PWD)" | awk '{print $$1}' | xargs -I {} git worktree remove {}
	@echo "$(GREEN)✓ Worktrees cleaned$(NC)"

.PHONY: branch-status
branch-status: ## [Git] Show current branch and status
	@echo "$(BLUE)📊 Git Status:$(NC)"
	@git status
	@echo ""
	@echo "$(BLUE)🌿 Current branch:$(NC)"
	@git branch --show-current
	@echo ""
	@echo "$(BLUE)📝 Recent commits:$(NC)"
	@git log --oneline -5

.PHONY: sync-main
sync-main: ## [Git] Pull latest changes from origin/main
	@echo "$(BLUE)🔄 Syncing with origin/main...$(NC)"
	@git fetch origin
	@git pull origin main
	@echo "$(GREEN)✓ Synced with origin/main$(NC)"

.PHONY: branch-clean
branch-clean: ## [Git] Delete merged branches (except main/achievements)
	@echo "$(BLUE)🧹 Cleaning merged branches...$(NC)"
	@git branch --merged | grep -v "main\|achievements\|*" | xargs -r git branch -d
	@echo "$(GREEN)✓ Merged branches cleaned$(NC)"

# ═══════════════════════════════════════════════════════════
# Utilities
# ═══════════════════════════════════════════════════════════

.PHONY: clean
clean: ## [Util] Remove build artifacts (dist, .vite)
	@echo "$(BLUE)🧹 Cleaning build artifacts...$(NC)"
	@rm -rf $(DIST_DIR) $(VITE_CACHE)
	@echo "$(GREEN)✓ Build artifacts cleaned$(NC)"

.PHONY: clean-all
clean-all: clean ## [Util] Remove all generated files (node_modules, dist, cache)
	@echo "$(BLUE)🧹 Removing all generated files...$(NC)"
	@rm -rf $(NODE_MODULES) $(DIST_DIR) $(VITE_CACHE) coverage .nyc_output
	@echo "$(GREEN)✓ All generated files removed$(NC)"

.PHONY: format
format: ## [Util] Format code with Prettier
	@echo "$(BLUE)✨ Formatting code...$(NC)"
	@$(NODE_BIN)/prettier --write "src/**/*.{ts,vue,css,json}"
	@echo "$(GREEN)✓ Code formatted$(NC)"

.PHONY: audit
audit: ## [Util] Run npm audit for security vulnerabilities
	@echo "$(BLUE)🔒 Checking for security vulnerabilities...$(NC)"
	@$(NPM) audit
	@echo "$(GREEN)✓ Security audit complete$(NC)"

.PHONY: audit-fix
audit-fix: ## [Util] Automatically fix security vulnerabilities
	@echo "$(BLUE)🔒 Fixing security vulnerabilities...$(NC)"
	@$(NPM) audit fix
	@echo "$(GREEN)✓ Security vulnerabilities fixed$(NC)"

.PHONY: outdated
outdated: ## [Util] Check for outdated dependencies
	@echo "$(BLUE)📦 Checking for outdated dependencies...$(NC)"
	@$(NPM) outdated

.PHONY: update
update: ## [Util] Update all dependencies to latest
	@echo "$(BLUE)📦 Updating dependencies...$(NC)"
	@$(NPM) update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

.PHONY: size
size: ## [Util] Analyze production bundle size
	@echo "$(BLUE)📊 Analyzing bundle size...$(NC)"
	@if [ -d "$(DIST_DIR)" ]; then \
		du -sh $(DIST_DIR)/*; \
		echo "$(YELLOW)Total size:$(NC)"; \
		du -sh $(DIST_DIR); \
	else \
		echo "$(RED)❌ Build directory not found. Run 'make build' first.$(NC)"; \
	fi

.PHONY: info
info: ## [Util] Show project information
	@echo "$(BLUE)╔═══════════════════════════════════════════════════════════╗$(NC)"
	@echo "$(BLUE)║                   Tetrys Project Info                    ║$(NC)"
	@echo "$(BLUE)╚═══════════════════════════════════════════════════════════╝$(NC)"
	@echo ""
	@echo "$(GREEN)Project:$(NC)      Tetrys - Mobile Responsive Retro Tetris"
	@echo "$(GREEN)Version:$(NC)      $$(node -p "require('./package.json').version")"
	@echo "$(GREEN)Node:$(NC)         $$(node --version)"
	@echo "$(GREEN)NPM:$(NC)          $$(npm --version)"
	@echo "$(GREEN)Branch:$(NC)       $$(git branch --show-current)"
	@echo "$(GREEN)Repository:$(NC)   $$(git remote get-url origin 2>/dev/null || echo 'No remote')"
	@echo ""
	@echo "$(BLUE)Worktrees:$(NC)"
	@git worktree list
	@echo ""

.PHONY: setup
setup: install ## [Util] Complete project setup (install + build + test)
	@echo "$(BLUE)🔧 Running initial setup...$(NC)"
	@$(MAKE) build
	@$(MAKE) test
	@echo "$(GREEN)✓ Project setup complete!$(NC)"
	@echo "$(YELLOW)Run 'make dev' to start development server$(NC)"

.PHONY: reset
reset: clean-all install ## [Util] Reset project (clean all + reinstall)
	@echo "$(GREEN)✓ Project reset complete!$(NC)"
	@echo "$(YELLOW)Run 'make dev' to start development$(NC)"
