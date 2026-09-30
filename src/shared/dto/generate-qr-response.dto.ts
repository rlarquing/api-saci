import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para la respuesta de generación de QRs
 */
export class GenerateQrResponseDto {
  @ApiProperty({
    description: 'ID del lote generado',
    example: 'lote-2024-01-15-001',
  })
  loteId: string;

  @ApiProperty({
    description: 'Cantidad de QRs generados',
    example: 10,
  })
  cantidadGenerada: number;

  @ApiProperty({
    description: 'Número consecutivo inicial',
    example: 1,
  })
  numeroInicial: number;

  @ApiProperty({
    description: 'Número consecutivo final',
    example: 10,
  })
  numeroFinal: number;

  @ApiProperty({
    description: 'Fecha de generación',
    example: '2024-01-15T08:00:00Z',
  })
  fechaGeneracion: Date;

  @ApiProperty({
    description: 'Producto etiquetado',
    example: 'Cemento gris 50 kg',
  })
  productoNombre: string;

  @ApiProperty({
    description: 'Almacen',
    example: 'Almacen # 1',
  })
  almacenNombre: string;

  @ApiProperty({
    description: 'Mensaje de confirmación',
    example: 'QRs generados exitosamente',
  })
  mensaje: string;
}
