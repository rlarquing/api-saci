import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class BuscarDto {
  @ApiProperty({ description: 'search', example: 'juan' })
  @IsOptional()
  @IsString()
  search: string;
}
