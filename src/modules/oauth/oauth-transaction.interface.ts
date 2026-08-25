export interface OAuthTransaction {
  provider: string;
  state: string;
  nonce: string;
  pkceVerifier: string;
  successUrl: string;
  errorUrl: string;
  createdAt: number;
  expiresAt: number;
}
