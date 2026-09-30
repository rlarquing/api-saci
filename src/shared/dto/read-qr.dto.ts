import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO para leer un QR generado
 */
export class ReadQrDto {
  @ApiProperty({
    description: 'ID del QR',
    example: '507f1f77bcf86cd799439011',
  })
  id: string;

  @ApiProperty({
    description: 'Código único del QR',
    example: 'QR-000001',
  })
  codigo: string;

  @ApiProperty({
    description: 'Número consecutivo',
    example: 1,
  })
  numeroConsecutivo: number;

  @ApiProperty({
    description: 'ID del tipo de medio',
    example: '507f1f77bcf86cd799439011',
  })
  productoId: string;

  @ApiProperty({
    description: 'Nombre del tipo de medio',
    example: 'Cemento gris 50 kg',
  })
  productoNombre: string;

  @ApiProperty({
    description: 'Código del tipo de medio',
    example: 'PRD-000001',
  })
  productoCodigo: string;

  @ApiProperty({
    description: 'ID del almacen',
    example: '507f1f77bcf86cd799439011',
  })
  almacenId: string;

  @ApiProperty({
    description: 'Nombre del almacen',
    example: 'Almacen # 1',
  })
  almacenNombre: string;

  @ApiProperty({
    description: 'Contenido del QR (JSON)',
    example:
      '{"productoCodigo":"PRD-000001","productoNombre":"Cemento gris 50 kg","numero":1}',
  })
  contenido: string;

  @ApiProperty({
    description: 'Fecha de generación',
    example: '2024-01-15T08:00:00Z',
  })
  fechaGeneracion: Date;

  @ApiProperty({
    description: 'ID del lote',
    example: 'lote-2024-01-15-001',
  })
  loteId: string;

  @ApiProperty({
    description: 'Estado del QR',
    example: 'disponible',
    enum: ['disponible', 'usado', 'anulado'],
  })
  estado: string;

  @ApiProperty({
    description: 'Fecha de estado (si aplica)',
    example: '2024-01-20T10:30:00Z',
    required: false,
  })
  fechaEstado?: Date;

  @ApiProperty({
    description: 'Si el registro está activo',
    example: true,
  })
  activo: boolean;
}
