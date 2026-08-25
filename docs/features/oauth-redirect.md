# Feature: Start External OAuth/OIDC Authentication

## Endpoint

```http
GET /v1/auth/oauth/{oauth-provider-slug}
```

Example:

```http
GET /v1/auth/oauth/google
```

## Purpose

Start authentication with an external OAuth/OIDC provider.

For now, Google is the only provider that needs to be supported.

The endpoint should:

1. Receive the provider slug.
2. Resolve the provider configuration from the backend.
3. Verify the provider is enabled.
4. Generate the required OAuth/OIDC security parameters.
5. Generate the provider authorization URL.
6. Redirect the user to the provider.

## Example flow

```text
Frontend
   │
   │ GET /v1/auth/oauth/google
   ▼
Identity Service
   │
   ├── resolve "google"
   ├── generate state
   ├── generate nonce
   ├── generate PKCE verifier/challenge
   ├── store temporary OAuth transaction
   │
   ▼
302 Redirect
   │
   ▼
Google Authorization Endpoint
```

## Provider slug

The `{oauth-provider-slug}` identifies a configured provider.

For now:

```text
google
```

The implementation should be provider-agnostic so that additional providers can be added later.

Do not accept arbitrary OAuth URLs, issuers, client IDs, or secrets from the request.

## Google configuration

Google configuration must come from server-side configuration/environment/database, not the frontend.

Example:

```text
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
GOOGLE_CALLBACK_URL
```

Use Google's OpenID Connect discovery metadata rather than hardcoding authorization/token endpoints where the chosen OIDC library supports discovery.

## OAuth/OIDC parameters

The generated authorization request should include the appropriate parameters for Google OIDC, including:

```text
client_id
redirect_uri
response_type=code
scope=openid email profile
state
nonce
code_challenge
code_challenge_method=S256
```

Use Authorization Code + PKCE.

Do not implement cryptographic primitives manually.

## State

Generate a cryptographically secure, random, single-use `state`.

Store the OAuth transaction server-side with a short expiration.

The transaction should contain enough information to complete the callback later, including:

```text
provider
state
nonce
pkce_verifier
created_at
expires_at
```

Redis is preferred for this temporary state.

Do not store the OAuth transaction only in process memory.

## Response

The endpoint should return an HTTP redirect:

```http
302 Found
Location: <provider authorization URL>
```

The frontend should not need to construct the Google authorization URL itself.

## Errors

Return a controlled error when:

- provider does not exist
- provider is disabled
- provider configuration is invalid
- authorization URL cannot be generated

Do not expose client secrets or internal configuration in error responses.

## Security

The implementation must:

- use cryptographically secure state
- use PKCE
- use OIDC nonce
- keep provider configuration server-side
- never expose client secrets
- never accept arbitrary provider URLs
- never accept arbitrary redirect URLs
- use a short expiration for OAuth transaction state

## Scope

Only implement:

```http
GET /v1/auth/oauth/{oauth-provider-slug}
```

Do NOT implement the callback yet.

Do NOT implement user creation/login yet.

Do NOT implement token exchange yet.

Do NOT implement `/providers` yet.

Do NOT add other OAuth providers yet.

The only goal of this task is:

```text
GET /v1/auth/oauth/google
        ↓
generate secure OAuth/OIDC request
        ↓
302 redirect to Google
```

Keep the implementation minimal and aligned with the existing NestJS architecture.
