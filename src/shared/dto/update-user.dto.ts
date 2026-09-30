import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsArray,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateUserDto {
  @IsOptional()
  @IsEmail()
  @ApiPropertyOptional({
    description: 'Email del usuario.',
    example: 'juan@camaguey.geocuba.cu',
  })
  email?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(4, {
    message: 'El nombre debe de tener al menos 4 carácteres',
  })
  @MaxLength(255, {
    message: 'El nombre debe de tener como máximo 255 carácteres',
  })
  @ApiProperty({ description: 'Nombre del usuario.', example: 'juan' })
  userName: string;

  @IsNotEmpty()
  @IsArray()
  @ApiProperty({
    description: 'Roles del usuario.',
    example: ['uuid-1', 'uuid-2'],
  })
  roles: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    description: 'Funciones del usuario.',
    example: ['uuid-1', 'uuid-2'],
  })
  funciones?: string[];

  @IsOptional()
  @IsArray()
  @ApiPropertyOptional({
    description: 'Almacenes del usuario.',
    example: ['uuid-1', 'uuid-2'],
  })
  almacenes?: string[];
}
