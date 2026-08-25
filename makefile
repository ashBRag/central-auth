.PHONY: install dev build start test test-watch lint \
	docker-build docker-up docker-down docker-restart docker-logs \
	docker-prod-build docker-prod-up docker-prod-down docker-prod-restart docker-prod-logs \
	prisma-generate prisma-migrate prisma-deploy prisma-studio \
	db-init clean help

# Install dependencies
install:
	pnpm install

# Run the app locally with hot reload
dev:
	pnpm run dev

# Build for production
build:
	pnpm run build

# Run the built app
start:
	pnpm run start

# Run tests
test:
	pnpm run test

test-watch:
	pnpm run test:watch

# Development Docker
# Uses docker-compose.yml and Dockerfile
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-restart:
	$(MAKE) docker-down
	$(MAKE) docker-up

docker-logs:
	docker compose logs -f api

# Production Docker
# Uses docker-compose.prod.yml and Dockerfile.prod
docker-prod-build:
	docker compose -f docker-compose.prod.yml build

docker-prod-up:
	docker compose -f docker-compose.prod.yml up -d

docker-prod-down:
	docker compose -f docker-compose.prod.yml down

docker-prod-restart:
	$(MAKE) docker-prod-down
	$(MAKE) docker-prod-up

docker-prod-logs:
	docker compose -f docker-compose.prod.yml logs -f api

# Prisma (requires the shared dev-stack Postgres to be running)
prisma-generate:
	pnpm run prisma:generate

prisma-migrate:
	pnpm run prisma:migrate

prisma-deploy:
	pnpm run prisma:deploy

prisma-studio:
	pnpm run prisma:studio

# Create and seed tables directly via psql
# Requires the shared dev-stack Postgres to be running
db-init:
	psql "$$DATABASE_URL" -f scripts/init.sql

# Remove build output and generated Prisma client
clean:
	rm -rf dist libs/prisma/src/generated

help:
	@echo "install             Install dependencies"
	@echo "dev                 Run the app locally with hot reload"
	@echo "build               Build for production"
	@echo "start               Run the built app"
	@echo "test                Run tests"
	@echo "test-watch          Run tests in watch mode"
	@echo ""
	@echo "Development Docker:"
	@echo "docker-build        Build the api image"
	@echo "docker-up           Start the api via docker compose"
	@echo "docker-down         Stop the api"
	@echo "docker-restart      Restart the api"
	@echo "docker-logs         Tail api logs"
	@echo ""
	@echo "Production Docker:"
	@echo "docker-prod-build   Build the production api image"
	@echo "docker-prod-up      Start the production api"
	@echo "docker-prod-down    Stop the production api"
	@echo "docker-prod-restart Restart the production api"
	@echo "docker-prod-logs    Tail production api logs"
	@echo ""
	@echo "Prisma:"
	@echo "prisma-generate     Regenerate the Prisma client"
	@echo "prisma-migrate     Create and apply a dev migration"
	@echo "prisma-deploy      Apply pending migrations (prod)"
	@echo "prisma-studio      Open Prisma Studio"
	@echo ""
	@echo "Database:"
	@echo "db-init             Create and seed tables via psql (scripts/init.sql)"
	@echo ""
	@echo "clean               Remove dist and generated Prisma client"