import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/** Payload de ENTRADA: escaneo de QR o alta manual por producto. */
export class CreateEntradaDto {
  @ApiPropertyOptional({ description: 'Código del QR escaneado' })
  @IsOptional()
  @IsString()
  qrCodigo?: string;

  @ApiPropertyOptional({ description: 'ID del producto (si no hay QR)' })
  @IsOptional()
  @IsString()
  productoId?: string;

  @ApiProperty({ description: 'ID del almacén de destino' })
  @IsString()
  almacenId!: string;

  @ApiProperty({ description: 'Cantidad a ingresar' })
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  cantidad!: number;

  @ApiPropertyOptional({ description: 'Fecha efectiva (offline ≤ 7 días)' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Lote del movimiento (P3, opcional)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lote?: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad del lote (P3, opcional)' })
  @IsOptional()
  @IsDateString()
  fechaCaducidad?: string;
}

export class CreateSalidaDto extends CreateEntradaDto {}

/** Payload de AJUSTE (conteo físico): solo JEFE/ADMIN, motivo obligatorio en negativos. */
export class CreateAjusteDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'ID del almacén' })
  @IsString()
  almacenId!: string;

  @ApiProperty({ description: 'Cantidad del ajuste (magnitud)' })
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  cantidad!: number;

  @ApiProperty({ description: 'Signo: 1 sobrante, -1 faltante' })
  @IsIn([1, -1])
  signo!: number;

  @ApiPropertyOptional({ description: 'Motivo (obligatorio si signo = -1)' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Fecha efectiva' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({ description: 'Lote del ajuste (P3, opcional)' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lote?: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad del lote (P3, opcional)' })
  @IsOptional()
  @IsDateString()
  fechaCaducidad?: string;
}

/** Payload de TRASLADO entre almacenes: crea el par compensado. */
export class CreateTrasladoDto {
  @ApiProperty({ description: 'ID del producto' })
  @IsString()
  productoId!: string;

  @ApiProperty({ description: 'Cantidad a trasladar' })
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  cantidad!: number;

  @ApiProperty({ description: 'ID del almacén de origen' })
  @IsString()
  almacenOrigenId!: string;

  @ApiProperty({ description: 'ID del almacén de destino' })
  @IsString()
  almacenDestinoId!: string;

  @ApiPropertyOptional({ description: 'Observaciones' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  @ApiPropertyOptional({ description: 'Fecha efectiva' })
  @IsOptional()
  @IsDateString()
  fecha?: string;

  @ApiPropertyOptional({
    description: 'Lote que viaja con la mercancía (P3, opcional)',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  lote?: string;

  @ApiPropertyOptional({ description: 'Fecha de caducidad del lote (P3, opcional)' })
  @IsOptional()
  @IsDateString()
  fechaCaducidad?: string;
}

/** Lectura del kardex. */
export class ReadMovimientoInventarioDto {
  @ApiProperty({ description: 'ID del movimiento' })
  id!: string;
  @ApiProperty({ description: 'Tipo de movimiento' })
  tipo!: string;
  @ApiProperty({ description: 'SKU del producto' })
  productoCodigo!: string;
  @ApiProperty({ description: 'Nombre del producto' })
  productoNombre!: string;
  @ApiProperty({ description: 'Cantidad movida' })
  cantidad!: number;
  @ApiProperty({ description: 'Almacén' })
  almacenNombre!: string;
  @ApiPropertyOptional({ description: 'Almacén destino (traslado)' })
  almacenDestinoNombre?: string;
  @ApiPropertyOptional({ description: 'Código del QR escaneado' })
  qrCodigo?: string;
  @ApiProperty({ description: 'Usuario que registró' })
  userName!: string;
  @ApiProperty({ description: 'Fecha efectiva' })
  fecha!: Date;
  @ApiPropertyOptional({ description: 'Saldo resultante informativo' })
  saldoResultante?: number;
  @ApiPropertyOptional({ description: 'Observaciones' })
  observaciones?: string;
  @ApiPropertyOptional({ description: 'Signo del ajuste' })
  signoAjuste?: number;
  @ApiPropertyOptional({ description: 'Lote del movimiento (P3)' })
  lote?: string;
  @ApiPropertyOptional({ description: 'Fecha de caducidad del lote (P3)' })
  fechaCaducidad?: Date;
}

/** Fila del stock derivado por lote (P3). */
export class ReadLoteStockDto {
  @ApiProperty({ description: 'ID del producto' })
  productoId!: string;
  @ApiProperty({ description: 'SKU' })
  productoCodigo!: string;
  @ApiProperty({ description: 'Nombre del producto' })
  productoNombre!: string;
  @ApiProperty({ description: 'Almacén' })
  almacenNombre!: string;
  @ApiProperty({ description: 'Lote (null = sin lote)' })
  lote!: string | null;
  @ApiProperty({ description: 'Fecha de caducidad (null = sin caducidad)' })
  fechaCaducidad!: Date | null;
  @ApiProperty({ description: 'Stock vivo del lote' })
  stock!: number;
  @ApiProperty({ description: 'VENCIDO | PROXIMO | OK | SIN_CADUCIDAD' })
  estado!: 'VENCIDO' | 'PROXIMO' | 'OK' | 'SIN_CADUCIDAD';
  @ApiProperty({ description: 'Días para vencer (negativo = vencido)' })
  diasParaVencer!: number | null;
}
