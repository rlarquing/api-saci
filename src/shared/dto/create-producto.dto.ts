import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ description: 'Nombre del producto' })
  @IsString()
  @MinLength(2)
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción del producto' })
  @IsOptional()
  @IsString()
  descripcion?: string;

  @ApiProperty({ description: 'ID de la categoría' })
  @IsString()
  categoriaId!: string;

  @ApiProperty({ description: 'ID de la unidad de medida' })
  @IsString()
  unidadId!: string;

  @ApiPropertyOptional({ description: 'Stock mínimo para alertas', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockMinimo?: number;

  @ApiPropertyOptional({
    description:
      'Foto como data URL (data:image/jpeg;base64,...). Comprimir en cliente a ≤512px / ~200KB',
  })
  @IsOptional()
  @IsString()
  @MaxLength(900000)
  foto?: string | null;
}

/** Payload dedicado para subir/actualizar solo la foto. */
export class FotoProductoDto {
  @ApiProperty({ description: 'Foto como data URL (image/jpeg|png|webp)' })
  @IsString()
  @MaxLength(900000)
  foto!: string;
}
