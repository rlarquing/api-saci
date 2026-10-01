/**
 * Nivel de stock por producto y almacén (SACI — backlog P2, patrón BoxHero).
 *
 * Generaliza el "stock mínimo" global del producto a umbrales configurables
 * por ubicación: stockMinimo (alerta dura de reposición) y stockSeguridad
 * (colchón antes del mínimo). El punto de reorden = stockMinimo + stockSeguridad.
 * Si no existe un nivel para un producto/almacén, se usa el stockMinimo y
 * stockSeguridad globales del producto como fallback.
 */
import { Column, Entity, Index } from 'typeorm';
import { IsNumber, IsString, Max, Min } from 'class-validator';
import { GenericEntity } from './generic.entity';

@Entity('nivel_stock')
export class NivelStockEntity extends GenericEntity {
  @Index()
  @Column({ nullable: false })
  @IsString()
  productoId!: string;

  /** Denormalizados del producto (snapshot al crear el nivel). */
  @Column({ nullable: false })
  @IsString()
  productoCodigo!: string;

  @Column({ nullable: false })
  @IsString()
  productoNombre!: string;

  @Index()
  @Column({ nullable: false })
  @IsString()
  almacenId!: string;

  @Column({ nullable: false })
  @IsString()
  almacenNombre!: string;

  /**
   * Stock mínimo por ubicación (alerta de reposición inmediata).
   * @default 0
   */
  @Column({ nullable: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockMinimo: number = 0;

  /**
   * Stock de seguridad por ubicación: colchón por encima del mínimo.
   * El punto de reorden es stockMinimo + stockSeguridad.
   * @default 0
   */
  @Column({ nullable: false, default: 0 })
  @IsNumber()
  @Min(0)
  @Max(999999.99)
  stockSeguridad: number = 0;

  constructor(partial?: Partial<NivelStockEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
