import {
  Controller,
  Post,
  Body,
  Headers,
  HttpCode,
  HttpStatus,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { AuthService } from "./auth.service";
import {
  SignupDto,
  LoginDto,
  RefreshTokenDto,
  IssueServiceTokenDto,
} from "../../schemas/auth.dto";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";
import { RefreshJwtAuthGuard } from "./guards/refresh-jwt-auth.guard";
import { CurrentUser } from "./decorators/current-user.decorator";
import { CurrentRefreshToken } from "./decorators/current-refresh-token.decorator";
import { AuthenticatedUser } from "./jwt-payload.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @UseGuards(RefreshJwtAuthGuard)
  refresh(
    @CurrentRefreshToken() current: { id: string; refreshToken: string },
    @Body() _dto: RefreshTokenDto
  ) {
    return this.authService.refresh(current.id, current.refreshToken);
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  logout(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.logout(user.id);
  }

  @Post("service-token")
  @HttpCode(HttpStatus.OK)
  issueServiceToken(
    @Body() dto: IssueServiceTokenDto,
    @Headers("x-service-key") serviceKey: string | undefined
  ) {
    return this.authService.issueServiceToken(dto, serviceKey);
  }
}
