import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

/**
 * DTO para filtrar QRs
 */
export class FilterQrDto {
  @ApiProperty({
    description: 'ID del tipo de medio (opcional)',
    example: '507f1f77bcf86cd799439011',
    required: false,
  })
  @IsOptional()
  @IsString()
  productoId?: string;

  @ApiProperty({
    description: 'ID del lote (opcional)',
    example: 'lote-2024-01-15-001',
    required: false,
  })
  @IsOptional()
  @IsString()
  loteId?: string;

  @ApiProperty({
    description: 'Estado del QR (opcional)',
    example: 'disponible',
    enum: ['disponible', 'usado', 'anulado'],
    required: false,
  })
  @IsOptional()
  @IsString()
  estado?: string;
}
