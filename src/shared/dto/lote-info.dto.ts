import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para información del lote
 */
export class LoteInfoDto {
  @ApiProperty({
    description: 'ID del lote',
    example: 'lote-2024-01-15-001',
  })
  loteId: string;

  @ApiProperty({
    description: 'Fecha de generación',
    example: '2024-01-15T08:00:00Z',
  })
  fechaGeneracion: Date;

  @ApiProperty({
    description: 'Nombre del tipo de medio',
    example: 'Bicicleta',
  })
  productoNombre: string;

  @ApiProperty({
    description: 'Código del tipo de medio',
    example: 'BIC001',
  })
  productoCodigo: string;

  @ApiProperty({
    description: 'Nombre del almacen',
    example: 'Almacen # 1',
  })
  almacenNombre: string;

  @ApiProperty({
    description: 'Cantidad de QRs en el lote',
    example: 10,
  })
  cantidad: number;

  @ApiProperty({
    description: 'Primer número consecutivo del lote',
    example: 1,
  })
  primerNumero: number;

  @ApiProperty({
    description: 'Último número consecutivo del lote',
    example: 10,
  })
  ultimoNumero: number;
}
