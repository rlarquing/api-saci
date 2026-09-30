import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ReadRolDto } from './read-rol.dto';
import { ReadFuncionDto } from './read-funcion.dto';

import { ReadNomencladorDto } from './read-nomenclador.dto';

export class ReadUserDto {
  dtoToString: string;

  @ApiProperty({
    description: 'id del usuario (MongoDB ObjectId como string)',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({ description: 'Nombre del usuario.', example: 'juan' })
  userName: string;

  @ApiPropertyOptional({
    description: 'Email del usuario.',
    example: 'juan@camaguey.geocuba.cu',
  })
  email: string;

  @ApiProperty({ description: 'Roles del usuario.', type: [ReadRolDto] })
  roles: ReadRolDto[];

  @ApiProperty({
    description: 'Funciones del usuario.',
    type: [ReadFuncionDto],
  })
  funciones: ReadFuncionDto[];

  @ApiProperty({
    description: 'Almacenes del usuario.',
    example: [ReadNomencladorDto],
  })
  almacenes: ReadNomencladorDto[];

  constructor(
    dtoToString: string,
    id: string,
    userName: string,
    email: string,
    roles: ReadRolDto[],
    funciones: ReadFuncionDto[],
    almacenes: ReadNomencladorDto[],
  ) {
    this.dtoToString = dtoToString;
    this.id = id;
    this.userName = userName;
    this.email = email;
    this.roles = roles;
    this.funciones = funciones;
    this.almacenes = almacenes;
  }
}
