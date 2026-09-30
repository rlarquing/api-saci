import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
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
}
