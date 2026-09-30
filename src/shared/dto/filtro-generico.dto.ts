import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsOptional, IsString } from 'class-validator';

export class FiltroGenericoDto {
  @ApiProperty({ description: 'clave.', example: ['nombre', 'edad'] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  clave: string[];

  @ApiProperty({ description: 'valor.', example: ['Luis', 46] })
  @IsOptional()
  @IsArray()
  valor: any[];
}
