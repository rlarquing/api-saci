import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class SelectDto {
  @ApiProperty({ description: 'id', example: 'uuid-aqui' })
  value: string;

  @IsString()
  @ApiProperty({ description: 'Nombre del nomenclador.', example: 'Nom 1' })
  label: string;

  constructor(id: string, nombre: string) {
    this.value = id;
    this.label = nombre;
  }
}
