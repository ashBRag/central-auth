---

name: identity-service
description: Enforce coding and architecture rules for the central Identity Service.
------------------------------------------------------------------------------------

# Identity Service Rules

## Stack

* Use NestJS + TypeScript.
* Use PostgreSQL + Prisma.
* Use Redis for ephemeral state where appropriate.
* Use Argon2 for password hashing.
* Use `jose` for JWT/JWK/JOSE operations.
* Use `oidc-provider` for the Identity Service's OAuth 2.0/OIDC provider functionality.
* Use `openid-client` for external OIDC providers.

Do not implement OAuth 2.0, OIDC, PKCE, JWT signing, or cryptographic primitives from scratch when an established library is available.

---

## Scope

Current supported authentication:

- Email/password
- Google OIDC
- External OIDC SSO
- OAuth 2.0
- OpenID Connect
- Access tokens
- Refresh tokens
- Sessions

Do not implement additional authentication features unless explicitly requested.

---

## OAuth Routes

Use one provider-parameterized route:

```text
GET /v1/auth/oauth/{oauth-provider-slug}
GET /v1/auth/oauth/{oauth-provider-slug}/callback
```

Do not create separate controller routes for individual providers.

Examples:

```text
/v1/auth/oauth/google
/v1/auth/oauth/microsoft
/v1/auth/oauth/acme
```

Provider-specific behavior must be implemented behind a provider abstraction/registry.

---

## OAuth Providers

The provider slug must resolve against a backend-controlled provider registry/configuration.

Do not accept arbitrary:

- issuer URLs
- authorization URLs
- token URLs
- client IDs
- client secrets
- redirect URLs

from the frontend/request.

Google is the only required provider currently.

---

## OAuth Security

OAuth/OIDC authorization flows must use:

- Authorization Code flow
- PKCE
- `state`
- OIDC `nonce` where applicable
- cryptographically secure random values
- validated redirect URIs
- validated issuer
- validated audience
- validated token signature
- validated token expiration

OAuth transaction state must be:

- server-side
- short-lived
- single-use

Prefer Redis for OAuth transaction state.

Never put access tokens or refresh tokens in redirect query parameters.

Never allow arbitrary frontend redirect URLs.

---

## Identity

Use internal `user_id` as the stable identity identifier.

JWT:

```text
sub = user_id
```

Do not use email as the stable identity identifier.

External identities must use:

```text
(provider, provider_subject)
```

as their unique identity.

For Google, use the OIDC `sub` claim as `provider_subject`.

Do not identify Google users by email.

---

## Database

Use Prisma for PostgreSQL access.

Core identity entities:

```text
users
credentials
identities
sessions
oidc_providers
```

Do not expose Prisma/database models directly through controllers.

Do not add application-profile fields to the Identity Service unless explicitly required.

---

## Microservice Boundary

Other microservices must not directly access the Identity Service database.

Do not add code that creates cross-service direct database dependencies.

Use tokens/API contracts for cross-service identity.

---

## Code Organization

Keep feature/business logic inside its owning module.

Use domain-oriented NestJS modules.

Controllers must remain thin.

Do not put business logic in controllers.

---

## Reusable Code

Place genuinely reusable functionality under:

```text
/libs
```

Place generic helper functions under:

```text
/libs/utils
```

Examples:

```text
/libs/utils/crypto
/libs/utils/dates
/libs/utils/validation
```

Do not put domain-specific business logic under `/libs/utils`.

Bad:

```text
/libs/utils/google-login.ts
/libs/utils/create-user.ts
/libs/utils/oauth-user-mapping.ts
```

Good:

```text
/libs/utils/crypto/random-string.ts
/libs/utils/dates/is-expired.ts
```

Do not create shared abstractions merely to reduce file size.

Only extract code when it is genuinely reusable or infrastructure-level.

---

## Dependency Direction

Enforce this dependency direction:

```text
Feature modules
      ↓
/libs
      ↓
/libs/utils
```

`/libs` and `/libs/utils` must not import feature-specific business logic.

Do not create:

```text
/libs → identity
/libs → oauth
/libs/utils → identity
/libs/utils → oauth
```

---

## Security

Never log:

- passwords
- password hashes
- access tokens
- refresh tokens
- authorization codes
- client secrets
- OAuth state
- PKCE verifiers

Use Argon2 for passwords.

Use short-lived access tokens.

Use refresh-token rotation.

---

## Implementation Discipline

When implementing a requested feature:

1. Modify only what is necessary.
2. Reuse existing code where appropriate.
3. Follow the existing module structure.
4. Check `/libs` and `/libs/utils` before creating duplicate helpers.
5. Do not implement unrequested features.
6. Do not create provider-specific routes when a parameterized OAuth route exists.
7. Add tests for changed behavior.
8. Run type checking, linting, and relevant tests after changes.
9. Do not introduce unnecessary abstractions.
10. Do not rewrite existing working authentication functionality without a specific reason.

## Development Infrastructure

For local development, PostgreSQL is provided by the shared development infrastructure project:

```
https://github.com/ashBRag/dev-arsenal/blob/main/docs/core.md
```

The PostgreSQL instance is part of the `backend-internal` infrastructure.

### Rules

- Do not add a PostgreSQL container to this project.
- Do not add a PostgreSQL service to `docker-compose.yml` for this project.
- Do not create a second local PostgreSQL instance.
- Use the PostgreSQL instance provided by `backend-internal`.
- Read the existing development infrastructure/configuration before adding database configuration.
- Keep application-specific database configuration in this project, but connect it to the shared PostgreSQL infrastructure.
- Do not modify `dev-arsenal` unless explicitly requested.
- Do not duplicate shared infrastructure configuration in this repository.

Before implementing database-dependent features, inspect the existing `backend-internal` configuration and use its established PostgreSQL connection details/conventions.
