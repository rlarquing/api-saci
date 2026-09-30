import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class FiltroDto {
  @ApiProperty({ description: 'Fecha.', example: '2021/05/16' })
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty({ description: 'Modelo.', example: 'UserEntity' })
  @IsOptional()
  @IsString()
  model?: string;

  @ApiProperty({ description: 'Datos.', example: '' })
  @IsOptional()
  @IsString()
  data?: string;

  @ApiProperty({ description: 'Record.', example: 25 })
  @IsOptional()
  @IsString()
  record?: string;

  @ApiProperty({ description: 'Accion.', example: 'Modificar' })
  @IsOptional()
  @IsString()
  action?: string;
}
