import { ApiProperty } from '@nestjs/swagger';

/** Nivel de stock (por producto/almacén) sincronizado al escáner offline. */
export class NivelStockSyncDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId: string;
  @ApiProperty({ description: 'ID del almacén' })
  almacenId: string;
  @ApiProperty({ description: 'Stock mínimo por ubicación' })
  stockMinimo: number;
  @ApiProperty({ description: 'Stock de seguridad por ubicación' })
  stockSeguridad: number;
}

/** Payload del evento socket 'notificacion' (push de umbrales de stock). */
export class NotificacionPayload {
  @ApiProperty({
    description: 'BAJO_MINIMO (stock < mínimo) o REORDEN (stock < punto de reorden)',
    example: 'BAJO_MINIMO',
  })
  tipo!: 'BAJO_MINIMO' | 'REORDEN';
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;
  @ApiProperty({ description: 'SKU del producto' })
  productoCodigo!: string;
  @ApiProperty({ description: 'Nombre del producto' })
  productoNombre!: string;
  @ApiProperty({ description: 'ID del almacén afectado' })
  almacenId!: string;
  @ApiProperty({ description: 'Nombre del almacén afectado' })
  almacenNombre!: string;
  @ApiProperty({ description: 'Stock resultante del movimiento' })
  stock!: number;
  @ApiProperty({ description: 'Umbral mínimo efectivo' })
  stockMinimo!: number;
  @ApiProperty({ description: 'Umbral de seguridad efectivo' })
  stockSeguridad!: number;
  @ApiProperty({ description: 'Punto de reorden efectivo (mínimo + seguridad)' })
  puntoReorden!: number;
  @ApiProperty({ description: 'Cantidad sugerida a reponer' })
  sugerido!: number;
  @ApiProperty({ description: 'Timestamp ISO del evento' })
  timestamp!: string;
}
