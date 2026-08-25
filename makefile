.PHONY: install dev build start test test-watch lint \
	docker-build docker-up docker-down docker-restart docker-logs \
	prisma-generate prisma-migrate prisma-deploy prisma-studio \
	clean help

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

# Build and start the service via docker compose (joins the shared backend-internal network)
docker-build:
	docker compose build

docker-up:
	docker compose up -d

docker-down:
	docker compose down

docker-restart:
	make docker-down
	make docker-up

docker-logs:
	docker compose logs -f api

# Prisma (requires the shared dev-stack Postgres to be running)
prisma-generate:
	pnpm run prisma:generate

prisma-migrate:
	pnpm run prisma:migrate

prisma-deploy:
	pnpm run prisma:deploy

prisma-studio:
	pnpm run prisma:studio

# Remove build output and generated Prisma client
clean:
	rm -rf dist libs/prisma/src/generated

help:
	@echo "install         Install dependencies"
	@echo "dev             Run the app locally with hot reload"
	@echo "build           Build for production"
	@echo "start           Run the built app"
	@echo "test            Run tests"
	@echo "test-watch      Run tests in watch mode"
	@echo "docker-build    Build the api image"
	@echo "docker-up       Start the api via docker compose"
	@echo "docker-down     Stop the api"
	@echo "docker-restart  Restart the api"
	@echo "docker-logs     Tail api logs"
	@echo "prisma-generate Regenerate the Prisma client"
	@echo "prisma-migrate  Create and apply a dev migration"
	@echo "prisma-deploy   Apply pending migrations (prod)"
	@echo "prisma-studio   Open Prisma Studio"
	@echo "clean           Remove dist and generated Prisma client"
