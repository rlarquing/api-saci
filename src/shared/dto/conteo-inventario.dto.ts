import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Payload de creación de un conteo cíclico. */
export class CreateConteoDto {
  @ApiProperty({ description: 'ID del almacén a contar' })
  @IsString()
  @MinLength(24)
  almacenId!: string;

  @ApiPropertyOptional({
    description:
      'Conteo a ciegas: la UI oculta el stock esperado hasta cerrar (anti-sesgo)',
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  esCiego?: boolean;
}

/** Payload para registrar la cantidad contada de un producto. */
export class ConteoLineaDto {
  @ApiProperty({ description: 'ID del producto contado' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'Cantidad física contada (0 incluido)' })
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  cantidadContada!: number;

  @ApiPropertyOptional({ description: 'Observación de la línea' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;
}

/** Lectura de un conteo (con líneas embebidas). */
export class ReadConteoDto {
  @ApiProperty({ description: 'ID del conteo' })
  id!: string;

  @ApiProperty({ description: 'ID del almacén' })
  almacenId!: string;

  @ApiProperty({ description: 'Nombre del almacén' })
  almacenNombre!: string;

  @ApiProperty({ description: 'Usuario que abrió el conteo' })
  userName!: string;

  @ApiProperty({ description: 'ABIERTO | CERRADO | CANCELADO' })
  estado!: string;

  @ApiProperty({ description: '¿Conteo a ciegas?' })
  esCiego!: boolean;

  @ApiProperty({ description: 'Fecha de apertura' })
  fechaApertura?: Date;

  @ApiPropertyOptional({ description: 'Fecha de cierre' })
  fechaCierre?: Date;

  @ApiProperty({ description: 'Líneas embebidas del conteo' })
  lineas!: Array<{
    productoId: string;
    productoCodigo: string;
    productoNombre: string;
    cantidadEsperada: number;
    cantidadContada: number | null;
    stockAlCierre: number | null;
    diferencia: number | null;
    ajusteId: string | null;
    observaciones?: string | null;
  }>;

  @ApiPropertyOptional({ description: 'Resumen al cerrar' })
  resumen?: Record<string, any> | null;

  @ApiProperty({ description: 'Total de líneas' })
  totalLineas!: number;

  @ApiProperty({ description: 'Líneas ya contadas' })
  totalContadas!: number;

  @ApiProperty({ description: 'Activo (soft-delete)' })
  activo!: boolean;

  @ApiProperty({ description: 'Fecha de creación' })
  createdAt!: Date;
}
