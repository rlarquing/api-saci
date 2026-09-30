import { ApiProperty } from '@nestjs/swagger';
import { ReadQrDto } from './read-qr.dto';

/**
 * Datos del movimiento activo (fase 1: informativo, vacío en SACI porque la
 * etiqueta es reutilizable y no hay "movimiento abierto" por QR).
 */
export class MovimientoActivoInfoDto {
  @ApiProperty({ description: 'ID del movimiento activo' })
  id: string;

  @ApiProperty({ description: 'Fecha del movimiento' })
  fecha: Date;

  @ApiProperty({ description: 'ID del almacén' })
  almacen_id: string;

  @ApiProperty({ description: 'Nombre del almacén' })
  almacen_nombre: string;

  @ApiProperty({ description: 'SKU del producto' })
  producto_codigo: string;
}

/**
 * DTO para la respuesta de validación de QR (SACI: decide entrada/salida/ajuste)
 */
export class ValidarQrResponseDto {
  @ApiProperty({
    description: 'Indica si el QR es válido',
    example: true,
  })
  valido: boolean;

  @ApiProperty({
    description: 'Mensaje para el operario',
    example: 'QR válido — entrada, salida o ajuste disponibles',
  })
  mensaje: string;

  @ApiProperty({
    description: 'Puede registrar ENTRADA con este QR',
    example: true,
  })
  puede_entrada: boolean;

  @ApiProperty({
    description: 'Puede registrar SALIDA con este QR',
    example: true,
  })
  puede_salida: boolean;

  @ApiProperty({
    description: 'Puede registrar AJUSTE con este QR',
    example: false,
  })
  puede_ajuste: boolean;

  @ApiProperty({
    description: 'Datos del QR validado',
    type: () => ReadQrDto,
  })
  qr: ReadQrDto;

  @ApiProperty({
    description: 'Movimiento activo (informativo)',
    type: MovimientoActivoInfoDto,
    nullable: true,
  })
  movimiento_activo: MovimientoActivoInfoDto | null;
}
