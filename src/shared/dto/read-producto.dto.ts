import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ReadProductoDto {
  @ApiProperty({ description: 'ID del producto' })
  id!: string;

  @ApiProperty({ description: 'SKU del producto' })
  codigo!: string;

  @ApiProperty({ description: 'Nombre del producto' })
  nombre!: string;

  @ApiPropertyOptional({ description: 'Descripción' })
  descripcion?: string;

  @ApiProperty({ description: 'ID de la categoría' })
  categoriaId!: string;

  @ApiProperty({ description: 'Nombre de la categoría' })
  categoriaNombre!: string;

  @ApiProperty({ description: 'ID de la unidad' })
  unidadId!: string;

  @ApiProperty({ description: 'Nombre de la unidad' })
  unidadNombre!: string;

  @ApiProperty({ description: 'Stock mínimo para alertas' })
  stockMinimo!: number;

  @ApiProperty({ description: '¿Tiene foto? (la imagen se sirve en /api/producto-foto/:id)' })
  hasFoto!: boolean;

  @ApiProperty({ description: 'Activo (soft-delete)' })
  activo!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;
}
