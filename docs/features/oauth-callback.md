# Feature: External OAuth/OIDC Callback

## Endpoint

```http
GET /v1/auth/oauth/{oauth-provider-slug}/callback
```

Example:

```text
GET /v1/auth/oauth/google/callback
```

This endpoint completes the OAuth/OIDC authentication flow started by:

```text
GET /v1/auth/oauth/{oauth-provider-slug}
```

Do not modify the OAuth start flow unless required to complete the callback.

---

## Flow

```text
External Provider
      │
      │ authorization response
      ▼
GET /v1/auth/oauth/google/callback
      │
      ├── validate state
      ├── retrieve OAuth transaction
      ├── exchange authorization code
      ├── validate OIDC response
      ├── resolve external identity
      ├── resolve/create internal user
      ├── create authenticated session
      │
      ▼
302 Redirect
      │
      ▼
Frontend
```

---

## Request

The callback receives standard OAuth/OIDC query parameters.

Successful example:

```text
GET /v1/auth/oauth/google/callback?code=...&state=...
```

Error example:

```text
GET /v1/auth/oauth/google/callback?error=access_denied&state=...
```

Do not accept authentication identity information directly from the frontend.

---

## Provider Resolution

Resolve `{oauth-provider-slug}` through the existing provider registry.

Example:

```text
google
```

must resolve to the configured Google OIDC provider.

Do not accept arbitrary provider URLs or configuration from the callback request.

If the provider does not exist or is disabled, fail safely.

---

## OAuth Transaction

Retrieve the temporary OAuth transaction created by the start endpoint using the returned `state`.

The transaction contains the information required to safely complete the flow, such as:

```text
provider
state
nonce
pkce_verifier
created_at
expires_at
```

Validate that:

- the transaction exists
- the transaction has not expired
- the transaction belongs to the requested provider
- the state matches
- the transaction has not already been consumed

The transaction must be single-use.

Delete/consume it after successful completion or terminal failure.

Use the existing Redis-backed transaction mechanism.

---

## OAuth Error

If the provider returns:

```text
error=access_denied
```

or another OAuth error:

1. Do not attempt authentication.
2. Consume the OAuth transaction.
3. Redirect to the configured frontend error destination.

Do not expose raw provider responses to the frontend.

---

## Authorization Code

For a successful callback:

```text
code
state
```

must be present.

Exchange the authorization code with the external provider using the stored PKCE verifier.

Do not exchange the code using a verifier supplied by the frontend.

Use the configured provider client credentials.

---

## OIDC Validation

For OIDC providers, validate the returned identity according to the provider's OIDC metadata and the library being used.

Validate at minimum:

- issuer
- audience/client ID
- token signature
- token expiration
- nonce
- authorization response
- required claims

Use the established OIDC client library.

Do not manually implement JWT/OIDC cryptographic validation.

---

## External Identity

After successful OIDC validation, obtain the provider's stable subject:

```text
sub
```

For Google:

```text
provider = google
provider_subject = Google OIDC sub
```

Look up:

```text
(provider, provider_subject)
```

in the `identities` table.

Never use email as the external identity key.

---

## Existing Identity

If the identity exists:

```text
provider + provider_subject
        ↓
identity
        ↓
user_id
```

authenticate the existing user.

Do not create another user.

---

## New Identity

If the external identity does not exist:

```text
provider + provider_subject
        ↓
no identity
```

Create a new internal user only when the provider has supplied sufficient trusted identity information according to the existing account-creation policy.

For Google v1, require a verified email before automatic account creation.

Create:

```text
users
```

and:

```text
identities
```

in the same logical operation.

The new identity must reference the newly created internal `user_id`.

---

## Existing Email

If the external provider returns an email that already belongs to an existing internal user but there is no matching external identity:

Do not silently merge/link the external identity solely because the email matches.

Follow the existing account-linking policy.

If no account-linking mechanism exists yet, fail safely and redirect the user to an appropriate frontend error.

Do not create duplicate accounts without an explicit policy.

---

## User Data

Only persist the identity information required by the Identity Service.

For Google, this may include:

```text
email
email_verified
```

Do not automatically persist arbitrary provider profile data.

Application profile information belongs to the appropriate User/Profile service.

---

## Session / Token Creation

After resolving the internal user:

```text
external identity
       ↓
internal user_id
       ↓
authenticated session
```

Use the existing authentication/session mechanism.

Do not create a separate session implementation specifically for Google.

The resulting authenticated session must behave the same way as an existing email/password login.

If the existing system uses access/refresh tokens, issue them through the existing token/session service.

Do not put tokens in the frontend redirect URL.

---

## Frontend Redirect

After successful authentication, redirect the browser to the configured frontend success destination.

Example:

```text
302
Location: https://app.example.com/auth/callback
```

Do not accept arbitrary redirect URLs from the callback request.

Use the redirect information associated with the OAuth transaction or a server-side allowlist/configuration.

Prevent open redirects.

---

## Error Redirect

Authentication failures should redirect to the configured frontend error destination.

Example:

```text
https://app.example.com/auth/error?code=oauth_failed
```

Use a small, safe application error code.

Do not include:

- access tokens
- refresh tokens
- authorization codes
- client secrets
- PKCE verifier
- raw provider errors
- stack traces
- sensitive identity information

in the redirect.

---

## Security Requirements

The callback must:

- validate `state`
- validate transaction expiration
- enforce single-use transaction state
- use the stored PKCE verifier
- validate OIDC nonce
- validate issuer
- validate audience/client ID
- validate token signature
- validate token expiration
- use the configured redirect URI
- prevent open redirects
- never trust frontend-supplied identity information
- never log authorization codes or tokens
- never expose tokens through redirect query parameters

---

## Atomicity

When creating a new user and external identity, ensure the operation is safe against duplicate creation/race conditions.

The database uniqueness constraint on:

```text
(provider, provider_subject)
```

must remain the final protection against duplicate external identities.

Handle uniqueness conflicts gracefully.

---

## Provider Independence

The callback must remain provider-agnostic.

The controller should not contain Google-specific identity logic.

Conceptually:

```text
OAuthCallbackController
        ↓
OAuthService
        ↓
Provider Registry
        ↓
Provider implementation
        ↓
Validated external identity
        ↓
Identity Service
        ↓
Session Service
```

Google-specific behavior belongs in the Google OIDC provider implementation.

---

## Scope

Implement only:

```http
GET /v1/auth/oauth/{oauth-provider-slug}/callback
```

Do not add:

- additional OAuth providers
- SAML
- MFA
- account-linking UI
- new authentication mechanisms
- new user profile functionality
- new authorization/RBAC functionality

Reuse the existing:

- user service
- identity model
- session service
- token service
- OAuth provider registry
- Redis OAuth transaction mechanism

The final result should make Google authentication behave as another authentication method for the existing Identity Service, rather than creating a separate authentication/session system.

---

## Implementation Notes (as built)

### Token transport

The callback never puts tokens in the redirect. Instead:

1. On successful authentication, the callback mints a one-time, single-use, short-lived (60s) `session_code`, stores `{ userId }` under it in Redis, and redirects to the transaction's `successUrl` with `?session_code=...`.
2. The frontend immediately exchanges it:

   ```http
   POST /v1/auth/oauth/session
   { "sessionCode": "..." }

   200 OK
   { "accessToken": "...", "refreshToken": "..." }
   ```

3. That endpoint deletes the code (single-use), loads the resolved user, and calls the **same** `AuthService.issueTokenPair` used by `/v1/auth/login` and `/v1/auth/signup` — no parallel token-issuance path.

### Error redirects

- `error=<provider error>` on the callback → transaction consumed, redirect to `errorUrl?error=oauth_denied`.
- Missing `code` → `errorUrl?error=oauth_failed`.
- Existing user email with no matching `(provider, provider_subject)` identity, or an unverified email on a would-be new account → `errorUrl?error=account_link_required` (no auto-linking, per the "Existing Email" policy above — no linking mechanism exists yet).
- Any OIDC/OAuth validation failure from `openid-client` (`OPError`/`RPError` — issuer, signature, nonce, expiry, etc.) → `errorUrl?error=oauth_failed`. Raw provider/library errors are never forwarded to the redirect.
- Missing/expired/mismatched transaction → request rejected directly (no transaction means no known `errorUrl` to redirect to).

### Identity resolution

`identities` table stores `provider`, `providerSubject`, `email`, `emailVerified`, `userId`, with a `(provider, providerSubject)` unique constraint. New user + identity creation happens inside one `prisma.$transaction`; a unique-constraint race on concurrent callbacks is handled by re-reading the identity that won.

`User.passwordHash` is nullable — OAuth-only users have no password, and `AuthService.login` explicitly rejects login attempts against such accounts rather than relying on bcrypt's comparison behavior against an empty hash.

### Redirect target

`successUrl`/`errorUrl` come from the `RedirectTarget` resolved by the start endpoint (see `oauth-redirect.md`) and carried through the Redis transaction — the callback itself never receives or trusts a redirect URL from the request.
