import {
  IsArray,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ArrayMinSize,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

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

  @ApiPropertyOptional({ description: 'Stock mínimo global para alertas', default: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockMinimo?: number;

  @ApiPropertyOptional({
    description: 'Stock de seguridad global (colchón sobre el mínimo)',
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockSeguridad?: number;

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

/** Atributo clave/valor de una variante (talla, color, modelo…). */
export class AtributoVarianteDto {
  @ApiProperty({ description: 'Nombre del atributo', example: 'Talla' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  clave!: string;

  @ApiProperty({ description: 'Valor del atributo', example: 'M' })
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  valor!: string;
}

/** Crear una VARIANTE bajo un producto padre (backlog P3). */
export class CreateVarianteDto {
  @ApiProperty({
    description: 'Atributos que distinguen la variante (talla/color…)',
    type: [AtributoVarianteDto],
  })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AtributoVarianteDto)
  atributos!: AtributoVarianteDto[];
}

/** Actualizar los atributos de una variante existente. */
export class UpdateAtributosVarianteDto extends CreateVarianteDto {} /** alias semántico */
