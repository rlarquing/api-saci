/**
 * Entidad de conteo cíclico de inventario (SACI — backlog P1).
 *
 * Un conteo es una tarea de verificación por almacén: al abrir se congela el
 * stock esperado por producto (snapshot), los operarios cuentan cantidades y
 * al cerrar se comparan contra el stock REAL (derivado de movimientos) y se
 * generan movimientos de AJUSTE auditables por cada diferencia.
 * Las líneas van embebidas (simple-json) como en registro_diario.
 */
import { Column, Entity, Index } from 'typeorm';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsString,
  MaxLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';

/** Línea de conteo embebida en el documento. */
export class LineaConteo {
  productoId!: string;
  productoCodigo!: string;
  productoNombre!: string;
  /** Stock derivado en el momento de abrir el conteo (snapshot). */
  cantidadEsperada!: number;
  /** Cantidad física contada por el operario (null mientras no se cuente). */
  cantidadContada: number | null = null;
  /** Stock real recalculado al cerrar (puede diferir del snapshot). */
  stockAlCierre: number | null = null;
  /** contada - stockAlCierre (negativo = faltante, positivo = sobrante). */
  diferencia: number | null = null;
  /** ID del movimiento de AJUSTE generado al cerrar. */
  ajusteId: string | null = null;
  observaciones?: string | null;

  constructor(partial?: Partial<LineaConteo>) {
    Object.assign(this, partial ?? {});
  }
}

export enum EstadoConteo {
  ABIERTO = 'ABIERTO',
  CERRADO = 'CERRADO',
  CANCELADO = 'CANCELADO',
}

@Entity('conteo_inventario')
export class ConteoInventarioEntity extends GenericEntity {
  @Index()
  @Column({ nullable: false })
  @IsString()
  almacenId!: string;

  @Column({ nullable: false })
  @IsString()
  @MaxLength(100)
  almacenNombre!: string;

  @Index()
  @Column({ nullable: false })
  @IsString()
  usuarioId!: string;

  @Column({ nullable: false })
  @IsString()
  @MaxLength(20)
  userName!: string;

  @Index()
  @Column({ nullable: false, default: EstadoConteo.ABIERTO })
  @IsString()
  @MaxLength(20)
  estado: EstadoConteo = EstadoConteo.ABIERTO;

  /** Conteo a ciegas: la UI no muestra el stock esperado hasta cerrar. */
  @Column({ nullable: false, default: false })
  @IsBoolean()
  esCiego: boolean = false;

  @Column({ type: 'timestamp', nullable: true })
  @IsDateString()
  fechaApertura?: Date;

  @Column({ type: 'timestamp', nullable: true })
  fechaCierre?: Date;

  @Column({ type: 'simple-json', nullable: false })
  @IsArray()
  lineas: LineaConteo[] = [];

  @Column({ type: 'simple-json', nullable: true })
  resumen?: {
    lineas: number;
    contadas: number;
    sinContar: number;
    sobrantes: number;
    faltantes: number;
    ajustesGenerados: number;
    errores: Array<{ productoCodigo: string; error: string }>;
  } | null;

  constructor(partial?: Partial<ConteoInventarioEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
