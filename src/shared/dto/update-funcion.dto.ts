import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateFuncionDto {
  @IsNotEmpty()
  @IsString({ message: 'El atributo nombre debe ser un strings' })
  @ApiProperty({
    description: 'Nombre de la función',
    example: 'Crear reportes',
  })
  nombre: string;
  @IsNotEmpty()
  @IsString({ message: 'El atributo descripcion debe ser un texto' })
  @ApiProperty({
    description: 'Descripción de la funcion',
    example: 'Crea reportes',
  })
  descripcion: string;

  @IsArray({ message: 'El atributo endPoints debe de ser un arreglo' })
  @ApiProperty({
    description: 'Los endPoints necesarios para que esta funcion trabaje',
    example: ['uuid-aqui'],
  })
  endPoints: string[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Relacion con la entidad menu',
    example: 'uuid-aqui',
  })
  menu?: string;
}
