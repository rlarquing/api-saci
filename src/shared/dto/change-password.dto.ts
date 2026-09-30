import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEqualTo } from '../../api/decorator';

export class ChangePasswordDto {
  @IsString()
  @ApiPropertyOptional({
    description: 'Contraseña del usuario.',
    example: 'Qwerty1234*',
  })
  oldPassword?: string;

  @IsString()
  @MinLength(8, {
    message: 'La contraseña debe tener al menos 8 carácteres.',
  })
  @MaxLength(255, {
    message: 'La contraseña debe tener como máximo 255 carácteres.',
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
  @MaxLength(255, {
    message: 'La contraseña debe tener como máximo 255 carácteres.',
  })
  @ApiProperty({
    description: 'Confirmar contraseña del usuario.',
    example: 'Qwerty1234*',
  })
  @IsEqualTo('password')
  confirmPassword: string;
}
