import { Column, Entity } from 'typeorm';
import { IsArray, IsOptional } from 'class-validator';
import { GenericNomencladorEntity } from './generic-nomenclador.entity';
import { MovimientoInventarioEntity } from './movimiento-inventario.entity';

/**
 * Entidad que representa una categoria de producto en el sistema.
 * Extiende de GenericNomencladorEntity para heredar id, activo, createdAt, updatedAt, nombre, descripcion.
 * Optimizada para MongoDB con referencias de ObjectId.
 *
 * @Entity('nom_categoria') - Define la colección en MongoDB
 */
@Entity('nom_categoria')
export class CategoriaEntity extends GenericNomencladorEntity {
  /**
   * IDs de los movimientos asociados (referencia MongoDB)
   * @example ["movimiento-id-1", "movimiento-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  movimientoIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (movimientos completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  movimientos?: MovimientoInventarioEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   */
  constructor(partial?: Partial<CategoriaEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
