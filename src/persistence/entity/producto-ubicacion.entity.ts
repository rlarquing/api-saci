/**
 * Ubicación interna (bin) de un producto dentro de un almacén
 * (SACI — backlog P3, patrón Sortly/Odoo).
 *
 * El nomenclador nom_ubicacion describe racks/estantes/celdas físicas;
 * esta entidad es el VÍNCULO producto→bin por almacén: dónde vive el
 * stock de un SKU en cada almacén. Regla: UNA ubicación activa por par
 * producto+almacén (la ubicación primaria; reasignar = editar o borrar).
 */
import { Column, Entity, Index } from 'typeorm';
import { IsString, Max, MaxLength, MinLength } from 'class-validator';
import { GenericEntity } from './generic.entity';

@Entity('producto_ubicacion')
export class ProductoUbicacionEntity extends GenericEntity {
  @Index()
  @Column({ nullable: false })
  @IsString()
  productoId!: string;

  /** Denormalizados del producto (snapshot al crear el vínculo). */
  @Column({ nullable: false })
  @IsString()
  @Max(50)
  productoCodigo!: string;

  @Column({ nullable: false })
  @IsString()
  @Max(100)
  productoNombre!: string;

  @Index()
  @Column({ nullable: false })
  @IsString()
  almacenId!: string;

  @Column({ nullable: false })
  @IsString()
  @Max(100)
  almacenNombre!: string;

  /** ID de la ubicación (nom_ubicacion) dentro del almacén. */
  @Index()
  @Column({ nullable: false })
  @IsString()
  ubicacionId!: string;

  /** Nombre de la ubicación (denormalizado para listados y escáner). */
  @Column({ nullable: false })
  @IsString()
  @MinLength(1)
  @Max(100)
  ubicacionNombre!: string;

  constructor(partial?: Partial<ProductoUbicacionEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  public toString(): string {
    return `${this.productoCodigo} @ ${this.almacenNombre} → ${this.ubicacionNombre}`;
  }
}
