import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class SessionCodeDto {
  @ApiProperty({
    description: "One-time code returned as ?session_code= on the OAuth success redirect.",
  })
  @IsString()
  @MinLength(1)
  sessionCode: string;
}

export class TokenPairResponseDto {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;
}
