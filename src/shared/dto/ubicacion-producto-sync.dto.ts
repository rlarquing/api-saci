import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Bin producto→almacén que viaja en la respuesta del sync (backlog P3). */
export class UbicacionProductoSyncDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;

  @ApiProperty({ description: 'ID del almacén' })
  almacenId!: string;

  @ApiProperty({ description: 'Nombre de la ubicación (bin)' })
  ubicacionNombre!: string;
}

/** Lote con stock vivo próximo a vencer (backlog P3, alertas del escáner). */
export class LoteProximoSyncDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;

  @ApiProperty({ description: 'SKU' })
  productoCodigo!: string;

  @ApiProperty({ description: 'Nombre del producto' })
  productoNombre!: string;

  @ApiProperty({ description: 'Lote' })
  lote!: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad (ISO)' })
  fechaCaducidad?: string | null;

  @ApiProperty({ description: 'Stock vivo del lote' })
  stock!: number;

  @ApiProperty({ description: 'Días para vencer (negativo = vencido)' })
  diasParaVencer!: number;
}
