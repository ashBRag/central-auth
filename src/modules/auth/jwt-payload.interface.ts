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

export interface ServiceTokenPayload {
  sub: string;
  aud: string;
  scope: string;
  user_id?: string;
  type: 'service';
}

export type JwtPayload =
  | AccessTokenPayload
  | RefreshTokenPayload
  | ServiceTokenPayload;

export interface AuthenticatedUser {
  id: string;
  email: string;
}

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}
