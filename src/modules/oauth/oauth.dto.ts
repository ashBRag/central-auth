import { IsString, MinLength } from "class-validator";

export class SessionCodeDto {
  @IsString()
  @MinLength(1)
  sessionCode: string;
}
