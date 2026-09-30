import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class RefreshTokenDto {
  @ApiProperty({ description: 'refreshToken.', example: 'uDUbczmRD6OxLNAS' })
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
