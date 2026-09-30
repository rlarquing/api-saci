import {
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEqualTo } from '../../api/decorator';

export class UserDto {
  @IsString()
  @IsNotEmpty()
  @MinLength(4, {
    message: 'El nombre debe de tener al menos 4 carácteres.',
  })
  @MaxLength(20, {
    message: 'El nombre debe de tener como máximo 20 carácteres.',
  })
  @ApiProperty({ description: 'Nombre del usuario.', example: 'juan' })
  userName: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 carácteres.',
  })
  @MaxLength(20, {
    message: 'La contraseña debe tener como máximo 20 carácteres.',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'La contraseña es muy débil.',
  })
  @ApiProperty({
    description: 'Contraseña del usuario.',
    example: 'Qwerty1234*',
  })
  password: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 carácteres.',
  })
  @MaxLength(20, {
    message: 'La contraseña debe tener como máximo 20 carácteres.',
  })
  @ApiProperty({
    description: 'Confirmar contraseña del usuario.',
    example: 'Qwerty1234*',
  })
  @IsEqualTo('password')
  confirmPassword: string;

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Email del usuario.',
    example: 'juan@camaguey.geocuba.cu',
  })
  email?: string;
}
