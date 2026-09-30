import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SelectDto } from './select.dto';
import { ReadFuncionDto } from './read-funcion.dto';

export class ReadRolDto {
  @IsString({ message: 'El dtoToString debe de ser un string' })
  dtoToString: string;

  @ApiProperty({ description: 'id del rol.', example: 'uuid-aqui' })
  id: string;

  @ApiProperty({ description: 'Nombre del rol.', example: 'Administrador' })
  nombre: string;

  @ApiProperty({
    description: 'Descripción del rol.',
    example: 'Tiene endPoint total del api',
  })
  descripcion: string;

  @ApiProperty({
    description: 'Usuarios que usan este rol.',
    type: [SelectDto],
  })
  users: SelectDto[];

  @ApiProperty({ description: 'Funciones del rol.', type: [ReadFuncionDto] })
  funciones: ReadFuncionDto[];

  constructor(
    dtoToString: string,
    id: string,
    nombre: string,
    descripcion: string,
    users: SelectDto[],
    funciones: ReadFuncionDto[],
  ) {
    this.dtoToString = dtoToString;
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.users = users;
    this.funciones = funciones;
  }
}
