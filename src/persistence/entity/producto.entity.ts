import { Column, Entity, Index } from 'typeorm';
import {
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { CategoriaEntity } from './categoria.entity';
import { UnidadEntity } from './unidad.entity';

/**
 * Producto del inventario: la unidad mínima catalogada con SKU propio.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB.
 *
 * @Entity('producto') - Define la colección en MongoDB
 */
@Entity('producto')
export class ProductoEntity extends GenericEntity {
  /**
   * Código único del producto (SKU, consecutivo global)
   * Formato: PRD-000001
   * @example "PRD-000001"
   */
  @Index({ unique: true })
  @Column({ nullable: false, unique: true })
  @IsString()
  @Max(50)
  codigo: string;

  /**
   * Número consecutivo del producto (para generar el SKU)
   * @example 1
   */
  @Column({ nullable: false })
  @IsNumber()
  numeroConsecutivo: number;

  /**
   * Nombre comercial del producto
   * @example "Cemento gris 50 kg"
   */
  @Column({ nullable: false })
  @IsString()
  @MinLength(2)
  @Max(100)
  nombre: string;

  /**
   * Descripción opcional del producto
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @Max(500)
  descripcion?: string;

  /**
   * ID de la categoría (nomenclador, referencia MongoDB)
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  categoriaId: string;

  /** Propiedad de compatibilidad para el mapper (no se persiste). */
  categoria?: CategoriaEntity;

  /** Nombre de la categoría (denormalizado para listados y payload del QR). */
  @Column({ nullable: false })
  @IsString()
  @Max(100)
  categoriaNombre: string;

  /**
   * ID de la unidad de medida (nomenclador, referencia MongoDB)
   */
  @Index()
  @Column({ nullable: false })
  @IsString()
  unidadId: string;

  /** Propiedad de compatibilidad para el mapper (no se persiste). */
  unidad?: UnidadEntity;

  /** Nombre de la unidad (denormalizado). */
  @Column({ nullable: false })
  @IsString()
  @Max(50)
  unidadNombre: string;

  /**
   * Stock mínimo global para alertas (el stock real se deriva de los
   * movimientos). Si existe un nivel específico producto/almacén
   * (nivel_stock), ese umbral tiene prioridad sobre este.
   * @default 0
   */
  @Column({ nullable: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockMinimo: number;

  /**
   * Stock de seguridad global: colchón sobre el mínimo. Punto de reorden
   * = stockMinimo + stockSeguridad. El nivel específico por almacén
   * (nivel_stock) tiene prioridad si existe.
   * @default 0
   */
  @Column({ nullable: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockSeguridad: number;

  /**
   * Foto del producto como data URL (comprimida en cliente a ≤512px JPEG).
   * Nunca se devuelve en listados (solo hasFoto); se sirve por /api/producto-foto/:id.
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(900000)
  foto?: string | null;

  constructor(partial?: Partial<ProductoEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
