import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { ReadFuncionDto } from './read-funcion.dto';
import { ReadMenuDto } from './read-menu.dto';
import { SelectDto } from './select.dto';

export class SecretDataDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre del usuario.',
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6Imp1YW4iLCJpYXQiOjE2Mjg4NTY5MzAsImV4cCI6MTYyODg2MDUzMH0.Ayxt1eCbRKbx7ya1QkZAjAHMWKWNL2BCZdqOHKVbb0g',
  })
  accessToken: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'Nombre del usuario.',
    example: 'OCbvl7fnhhzg5KVm',
  })
  refreshToken: string;

  @IsNotEmpty()
  @ApiProperty({
    description: 'Funciones del usuario.',
    example: [ReadFuncionDto],
  })
  functions: ReadFuncionDto[];

  @IsNotEmpty()
  @ApiProperty({
    description: 'Menu del usuario.',
    example: [ReadMenuDto],
  })
  menus: ReadMenuDto[];

  @IsNotEmpty()
  @ApiProperty({
    description: 'Almacenes del usuario (si es admin retorna todos).',
    example: [SelectDto],
  })
  almacenes: SelectDto[];

  @IsNotEmpty()
  @ApiProperty({
    description: 'Tipos de medio disponibles.',
    example: [SelectDto],
  })
  categorias: SelectDto[];

  @IsString()
  @IsNotEmpty()
  @ApiProperty({
    description: 'ID del usuario.',
    example: '507f1f77bcf86cd799439011',
  })
  userId: string;

  @IsString()
  @IsNotEmpty()
  @ApiProperty({ description: 'Nombre de usuario.', example: 'admin' })
  userName: string;

  @IsString()
  @ApiProperty({
    description: 'Correo electrónico del usuario.',
    example: 'admin@sacp.com',
  })
  email: string;

  @IsNotEmpty()
  @ApiProperty({ description: 'Roles del usuario.', example: [SelectDto] })
  roles: SelectDto[];
}
