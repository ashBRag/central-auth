-- Creates and seeds the Identity Service tables.
-- Column names/types mirror prisma/schema.prisma exactly (no @map on fields,
-- so Prisma's camelCase field names are the actual column names).
-- Safe to re-run: tables use IF NOT EXISTS, seed rows use ON CONFLICT.

CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "email" TEXT NOT NULL UNIQUE,
    "passwordHash" TEXT,
    "refreshTokenHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "oidc_providers" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL UNIQUE,
    "issuerUrl" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "clientSecret" TEXT NOT NULL,
    "callbackUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "identities" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "provider" TEXT NOT NULL,
    "providerSubject" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT NOT NULL REFERENCES "users"("id"),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    CONSTRAINT "identities_provider_providerSubject_key" UNIQUE ("provider", "providerSubject")
);

CREATE TABLE IF NOT EXISTS "redirect_targets" (
    "id" TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "slug" TEXT NOT NULL UNIQUE,
    "successUrl" TEXT NOT NULL,
    "errorUrl" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT now(),
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT now()
);

-- Seed: Google OIDC provider. Replace the placeholder client id/secret/callback
-- before relying on this in a real environment.
INSERT INTO "oidc_providers" ("slug", "issuerUrl", "clientId", "clientSecret", "callbackUrl", "enabled")
VALUES (
    'google',
    'https://accounts.google.com',
    'changeme-google-client-id',
    'changeme-google-client-secret',
    'http://localhost:3001/v1/auth/oauth/google/callback',
    true
)
ON CONFLICT ("slug") DO NOTHING;

-- Seed: default frontend redirect target.
INSERT INTO "redirect_targets" ("slug", "successUrl", "errorUrl", "enabled")
VALUES (
    'default',
    'http://localhost:3000/auth/callback',
    'http://localhost:3000/auth/error',
    true
)
ON CONFLICT ("slug") DO NOTHING;
