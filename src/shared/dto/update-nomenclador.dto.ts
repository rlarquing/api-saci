import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
export class UpdateNomencladorDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(4, {
    message: 'El nombre debe de tener al menos 4 carácteres.',
  })
  @MaxLength(255, {
    message: 'El nombre debe tener como máximo 255 carácteres.',
  })
  @ApiProperty({ description: 'Nombre del nomenclador.', example: 'Nom 1' })
  nombre: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(4, {
    message: 'La descripción debe de tener al menos 4 carácteres.',
  })
  @MaxLength(255, {
    message: 'La descripción debe tener como máximo 255 carácteres.',
  })
  @ApiProperty({
    description: 'Descripción del nomenclador.',
    example: 'Descripción del nom',
  })
  descripcion: string;
}
