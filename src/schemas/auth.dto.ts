import { IsEmail, IsOptional, IsString, MinLength } from 'class-validator';

export class SignupDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}

export class LoginDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(1)
  password: string;
}

export class RefreshTokenDto {
  @IsString()
  @MinLength(1)
  refreshToken: string;
}

export class IssueServiceTokenDto {
  @IsString()
  @MinLength(1)
  sub: string;

  @IsString()
  @MinLength(1)
  aud: string;

  @IsString()
  scope: string;

  @IsOptional()
  @IsString()
  user_id?: string;
}
