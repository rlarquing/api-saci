import {
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AuthCredentialsDto {
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
}
