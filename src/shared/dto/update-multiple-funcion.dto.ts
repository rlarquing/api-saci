import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateMultipleFuncionDto {
  @IsNotEmpty()
  @IsString({ message: 'El atributo id debe ser un texto' })
  @ApiProperty({
    description: 'id de la funcion',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

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
    example: ['507f1f77bcf86cd799439011'],
  })
  endPoints: string[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Relacion con la entidad menu',
    example: '507f1f77bcf86cd799439011',
  })
  menu?: string;
}
