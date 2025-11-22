.PHONY: help install dev build clean docker-up docker-down worker-dev worker-prod

help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  %-20s %s\n", $$1, $$2}'

install: ## Install all dependencies
	npm install
	cd worker && npm install

dev: ## Start frontend development server
	npm run dev

worker-dev: ## Start worker in development mode with hot reload
	npm run worker:dev

worker-prod: ## Start worker in production mode
	npm run worker:prod

build: ## Build for production
	npm run build

docker-up: ## Start all Docker services (Temporal, LiteLLM)
	docker-compose up -d

docker-down: ## Stop all Docker services
	docker-compose down

docker-logs: ## View Docker service logs
	docker-compose logs -f

docker-restart: ## Restart all Docker services
	docker-compose restart

clean: ## Clean build artifacts and dependencies
	rm -rf node_modules
	rm -rf worker/node_modules
	rm -rf .next
	rm -rf worker/dist
	rm -rf workflows/definitions/*.ts
	rm -rf workflows/activities/*.ts
	rm -rf workflows/metadata/*.json

setup: install docker-up ## Complete setup (install + start Docker)
	@echo "✅ Setup complete!"
	@echo "Run 'make dev' in one terminal and 'make worker-dev' in another"

full-start: docker-up ## Start everything (Docker + Frontend + Worker)
	@echo "Starting all services..."
	npm run dev & npm run worker:dev

test-temporal: ## Test Temporal connection
	curl -v http://localhost:7233 || echo "Temporal server not responding"

test-litellm: ## Test LiteLLM proxy
	curl http://localhost:4000/health

status: ## Check status of all services
	@echo "Checking Docker services..."
	@docker-compose ps
	@echo "\nChecking Temporal UI..."
	@curl -s -o /dev/null -w "Temporal UI: %{http_code}\n" http://localhost:8080 || echo "Temporal UI: DOWN"
	@echo "Checking LiteLLM..."
	@curl -s -o /dev/null -w "LiteLLM: %{http_code}\n" http://localhost:4000/health || echo "LiteLLM: DOWN"
