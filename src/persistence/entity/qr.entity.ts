import { Column, Entity, Index } from 'typeorm';
import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Max,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { ProductoEntity } from './producto.entity';
import { AlmacenEntity } from './almacen.entity';

/**
 * Entidad que representa un QR generado en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB.
 *
 * @Entity('qr') - Define la colección en MongoDB
 */
@Entity('qr')
export class QrEntity extends GenericEntity {
  /**
   * Código único del QR (consecutivo global)
   * Formato: QR-000001
   * @example "QR-000001"
   */
  @Index({ unique: true })
  @Column({ nullable: false, unique: true })
  @IsString()
  @Max(50)
  codigo: string;

  /**
   * Número consecutivo del QR
   * @example 1
   */
  @Column({ nullable: false })
  @IsNumber()
  numeroConsecutivo: number;

  /**
   * ID del producto (referencia MongoDB)
   * @example "categoria-id-123"
   */
  @Index()
  @Column({
    nullable: false,
  })
  @IsString()
  productoId: string;

  /**
   * Propiedad de compatibilidad para el mapper (producto completo)
   * No se persiste en la base de datos, se usa en memoria
   */
  producto?: ProductoEntity;

  /**
   * Nombre del producto (denormalizado para rápida visualización)
   * @example "Cemento gris 50 kg"
   */
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  productoNombre: string;

  /**
   * SKU del producto (denormalizado)
   * @example "PRD-000001"
   */
  @Column({ nullable: false })
  @IsString()
  @Max(20)
  productoCodigo: string;

  /**
   * ID del almacen (referencia MongoDB)
   * @example "almacen-id-123"
   */
  @Index()
  @Column({
    nullable: false,
  })
  @IsString()
  almacenId: string;

  /**
   * Propiedad de compatibilidad para el mapper (almacen completo)
   * No se persiste en la base de datos, se usa en memoria
   */
  almacen?: AlmacenEntity;

  /**
   * Nombre del almacen (denormalizado para rápida visualización)
   * @example "Almacen # 1"
   */
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  almacenNombre: string;

  /**
   * Contenido del QR (JSON stringificado)
   * @example '{"productoCodigo":"PRD-000001","productoNombre":"Cemento gris 50 kg","almacenNombre":"Depósito central"}'
   */
  @Column({ nullable: false, type: 'text' })
  @IsString()
  contenido: string;

  /**
   * Fecha de generación del lote
   * @example "2024-01-15T08:00:00Z"
   */
  @Index()
  @Column({
    type: 'timestamp',
    default: () => 'CURRENT_TIMESTAMP',
  })
  @IsDateString()
  fechaGeneracion: Date;

  /**
   * ID del lote de generación (para agrupar QRs generados juntos)
   * @example "lote-2024-01-15-001"
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  loteId: string;

  /**
   * Estado del QR (disponible, asignado, anulado) — etiqueta REUTILIZABLE, no ticket
   * @example "disponible"
   */
  @Index()
  @Column({ default: 'disponible' })
  @IsString()
  @Max(20)
  estado: string;

  /**
   * Fecha del estado del qr (opcional)
   * @example "2024-01-20T10:30:00Z"
   */
  @Column({
    type: 'timestamp',
    nullable: true,
  })
  @IsOptional()
  @IsDateString()
  fechaEstado?: Date;

  /**
   * Constructor con parámetros opcionales para creación flexible
   */
  constructor(partial?: Partial<QrEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    return `${this.codigo} - ${this.productoNombre}`;
  }
}
