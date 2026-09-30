import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateMultipleRolDto {
  @IsNotEmpty()
  @ApiProperty({ description: 'id del rol.', example: 1 })
  id: number;

  @IsNotEmpty()
  @IsString()
  @MinLength(4, {
    message: 'El nombre debe de tener al menos 4 carácteres.',
  })
  @MaxLength(255, {
    message: 'El nombre debe tener como máximo 255 carácteres.',
  })
  @ApiProperty({ description: 'Nombre del rol.', example: 'Administrador' })
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({
    description: 'Descripción del rol.',
    example: 'Tiene endPoint total del api.',
  })
  descripcion: string;

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Usuarios que tienen este rol.',
    example: ['507f1f77bcf86cd799439011'],
  })
  users?: string[];

  @IsArray()
  @IsOptional()
  @ApiProperty({
    description: 'Funciones del rol.',
    example: ['507f1f77bcf86cd799439011'],
  })
  funciones?: string[];
}
