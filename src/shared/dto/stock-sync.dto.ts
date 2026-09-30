import { ApiProperty } from '@nestjs/swagger';

/** Fila de stock actual por producto+almacén para el escáner offline. */
export class StockSyncDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId: string;
  @ApiProperty({ description: 'ID del almacén' })
  almacenId: string;
  @ApiProperty({ description: 'Unidades disponibles' })
  stock: number;
}
