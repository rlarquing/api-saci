import { ApiProperty } from '@nestjs/swagger';

/** Producto sincronizado al escáner offline (SACI). */
export class ProductoSyncDto {
  @ApiProperty({ description: 'ID del producto' })
  id: string;
  @ApiProperty({ description: 'SKU' })
  codigo: string;
  @ApiProperty({ description: 'Nombre' })
  nombre: string;
  @ApiProperty({ description: 'ID de la categoría' })
  categoriaId: string;
  @ApiProperty({ description: 'Nombre de la categoría' })
  categoriaNombre: string;
  @ApiProperty({ description: 'Unidad de medida' })
  unidadNombre: string;
  @ApiProperty({ description: 'Stock mínimo' })
  stockMinimo: number;
  @ApiProperty({ description: 'Stock de seguridad global' })
  stockSeguridad: number;
  @ApiProperty({ description: 'Activo' })
  activo: boolean;
  @ApiProperty({ description: 'Actualizado' })
  updatedAt: string;
}
