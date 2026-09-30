import { ApiProperty } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
} from 'class-validator';

/**
 * DTO de petición para verificar el estado de varios QRs en una sola llamada
 * (POST /api/movimiento/estado)
 */
export class VerificarEstadoMovimientosDto {
  @ApiProperty({
    description: 'Códigos QR a verificar',
    example: ['QR-000001'],
    maxItems: 100,
  })
  @IsArray()
  @ArrayNotEmpty()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  codigos: string[];
}

/**
 * DTO de respuesta: estado de un QR (dentro/fuera y fecha de salida real)
 */
export class EstadoMovimientoDto {
  @ApiProperty({ description: 'Código QR', example: 'QR-000001' })
  codigo: string;

  @ApiProperty({
    description: 'Indica si el vehículo está dentro del almacen',
    example: false,
  })
  dentro: boolean;

  @ApiProperty({
    description: 'Fecha de salida real (null si el vehículo está dentro)',
    example: '2024-01-15T18:30:00.000Z',
    nullable: true,
  })
  fechaSalida: string | null;
}
