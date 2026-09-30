import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class ReadNomencladorDto {
  @IsString({ message: 'El dtoToString debe de ser un string' })
  dtoToString: string;

  @ApiProperty({ description: 'id', example: 'uuid-aqui' })
  id: string;

  @IsString()
  @ApiProperty({ description: 'Nombre del nomenclador.', example: 'Nom 1' })
  nombre: string;

  @IsString()
  @ApiProperty({
    description: 'Descripción del nomenclador.',
    example: 'Descripción del nom',
  })
  descripcion: string;

  constructor(
    id: string,
    nombre: string,
    descripcion: string,
    dtoToString: string,
  ) {
    this.id = id;
    this.nombre = nombre;
    this.descripcion = descripcion;
    this.dtoToString = dtoToString;
  }
}
