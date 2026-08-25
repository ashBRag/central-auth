import { HttpStatus } from "@nestjs/common";
import { AppError } from "../../errors/app-errors";

export class OAuthProviderConfigError extends AppError {
  constructor(message = "OAuth provider is not configured correctly.") {
    super("OAUTH_PROVIDER_CONFIG_ERROR", message, HttpStatus.BAD_GATEWAY);
  }
}

export class OAuthTransactionError extends AppError {
  constructor(message = "OAuth transaction is invalid or expired.") {
    super("OAUTH_TRANSACTION_ERROR", message, HttpStatus.BAD_REQUEST);
  }
}

export class OAuthAccountLinkingRequiredError extends AppError {
  constructor(
    message = "An account with this email already exists and must be linked explicitly."
  ) {
    super(
      "OAUTH_ACCOUNT_LINKING_REQUIRED",
      message,
      HttpStatus.CONFLICT
    );
  }
}

export class OAuthSessionCodeError extends AppError {
  constructor(message = "Session code is invalid or expired.") {
    super("OAUTH_SESSION_CODE_ERROR", message, HttpStatus.UNAUTHORIZED);
  }
}
