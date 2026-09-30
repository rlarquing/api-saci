import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IsEqualTo } from '../../api/decorator';

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsNumber({}, { message: 'El código debe ser un número' })
  @ApiProperty({
    description: 'Code',
    example: 456123,
  })
  resetPasswordCode: number;

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
}
