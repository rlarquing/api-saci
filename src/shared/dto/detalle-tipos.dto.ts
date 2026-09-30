import { ApiProperty } from '@nestjs/swagger';

/** Detalle por categoría del registro diario de inventario. */
export class DetalleTiposDto {
  @ApiProperty({ description: 'Categoría del producto.', example: 'Materiales' })
  categoria: string;

  @ApiProperty({ description: 'Unidades entradas del día.', example: 25 })
  entradas: number;

  @ApiProperty({ description: 'Unidades salidas del día.', example: 10 })
  salidas: number;
}
