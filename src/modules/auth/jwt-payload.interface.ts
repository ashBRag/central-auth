export interface AccessTokenPayload {
  sub: string;
  email: string;
  type: 'access';
  scope: string;
}

export interface RefreshTokenPayload {
  sub: string;
  email: string;
  type: 'refresh';
}

export type JwtPayload = AccessTokenPayload | RefreshTokenPayload;

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
