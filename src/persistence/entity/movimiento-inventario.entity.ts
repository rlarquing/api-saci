import { Column, Entity, Index } from 'typeorm';
import {
  IsDateString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { ProductoEntity } from './producto.entity';
import { AlmacenEntity } from './almacen.entity';

/** Tipo de movimiento de inventario. */
export enum TipoMovimiento {
  ENTRADA = 'ENTRADA',
  SALIDA = 'SALIDA',
  AJUSTE = 'AJUSTE',
  TRASLADO = 'TRASLADO',
}

/**
 * Movimiento de inventario: registro atómico de entrada, salida, ajuste o traslado.
 * La FUENTE ÚNICA DE VERDAD del stock: las existencias se derivan por agregación
 * de esta colección (Σ entradas + ajustes+ − salidas − ajustes−), nunca de un
 * contador editable. Optimizada para MongoDB.
 *
 * @Entity('movimiento_inventario') - Define la colección en MongoDB
 */
@Entity('movimiento_inventario')
export class MovimientoInventarioEntity extends GenericEntity {
  /**
   * Tipo de movimiento
   * @example "ENTRADA"
   */
  @Index()
  @Column({ nullable: false })
  @IsEnum(TipoMovimiento)
  tipo: TipoMovimiento;

  /**
   * ID del producto (referencia MongoDB)
   * @example "producto-id-123"
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  productoId: string;

  /** Propiedad de compatibilidad para el mapper (no se persiste). */
  producto?: ProductoEntity;

  /** Nombre del producto (denormalizado para kardex sin joins). */
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  productoNombre: string;

  /** SKU del producto (denormalizado). */
  @Column({ nullable: false })
  @IsString()
  @Max(50)
  productoCodigo: string;

  /**
   * Cantidad movida (siempre positiva; el signo lo determina el tipo)
   * @example 25
   */
  @Column({ type: 'float', nullable: false })
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  cantidad: number;

  /**
   * Almacén del movimiento (destino en ENTRADA, origen en SALIDA/AJUSTE/TRASLADO)
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  almacenId: string;

  /** Propiedad de compatibilidad para el mapper (no se persiste). */
  almacen?: AlmacenEntity;

  /** Nombre del almacén (denormalizado). */
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  almacenNombre: string;

  /**
   * Almacén destino (solo TRASLADO)
   */
  @Index()
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  almacenDestinoId?: string;

  /** Nombre del almacén destino (denormalizado, solo TRASLADO). */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Max(100)
  almacenDestinoNombre?: string;

  /**
   * ID del QR escaneado (opcional: los ajustes manuales no escanean)
   */
  @Index()
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  qrId?: string;

  /** Código del QR escaneado (denormalizado). */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Max(50)
  qrCodigo?: string;

  /**
   * ID de usuario que registró el movimiento
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  usuarioId: string;

  /** Nombre de usuario (denormalizado para el kardex). */
  @Column({ nullable: false })
  @IsString()
  @Max(20)
  userName: string;

  /**
   * Fecha efectiva del movimiento (no futura; offline ≤ 7 días de antigüedad)
   */
  @Index()
  @Column({ type: 'timestamp', nullable: false })
  @IsDateString()
  fecha: Date;

  /**
   * Observaciones (obligatorias en AJUSTE negativo: motivo del conteo físico)
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  observaciones?: string;

  /**
   * Signo del ajuste: 1 (sobrante) o -1 (faltante). Solo AJUSTE.
   * Lo consume la agregación de stock.
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsNumber()
  signoAjuste?: number;

  /**
   * Saldo resultante informativo, congelado al registrar (NUNCA fuente de verdad)
   * @example 120
   */
  @Column({ type: 'float', nullable: true })
  @IsOptional()
  @IsNumber()
  saldoResultante?: number;

  /**
   * Agrupa el par compensado de un TRASLADO (mismo valor en salida y entrada)
   */
  @Index()
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Max(100)
  trasladoId?: string;

  /**
   * Lote del movimiento (backlog P3): identificador de lote/fabricación que
   * viaja con la mercancía. Opcional; se estampa al crear el movimiento y
   * NUNCA se edita (los movimientos son inmutables). El stock por lote se
   * deriva agregando esta colección por (producto, almacén, lote).
   */
  @Index()
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MinLength(1)
  @Max(50)
  lote?: string;

  /**
   * Fecha de caducidad del lote (backlog P3): alimenta las alertas de
   * "próximo a vencer" (VENCIDO / PRÓXIMO / OK). Opcional; inmutable.
   */
  @Column({ type: 'timestamp', nullable: true })
  @IsOptional()
  @IsDateString()
  fechaCaducidad?: Date;

  /**
   * Fecha de salida análoga a SACP: `activo=false` marca un movimiento REVERTIDO
   * por compensación (no cuenta para el stock). Heredamos `activo` para esto.
   */

  constructor(partial?: Partial<MovimientoInventarioEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /** Representación en string de la entidad. */
  public toString(): string {
    return `${this.tipo} ${this.cantidad} ${this.productoCodigo} @ ${this.almacenNombre}`;
  }
}
