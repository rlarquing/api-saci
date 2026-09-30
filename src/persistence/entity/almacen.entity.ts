import { Column, Entity } from 'typeorm';
import { IsArray, IsOptional } from 'class-validator';
import { GenericNomencladorEntity } from './generic-nomenclador.entity';
import { RegistroDiarioEntity } from './registro-diario.entity';
import { MovimientoInventarioEntity } from './movimiento-inventario.entity';

/**
 * Entidad que representa un almacen en el sistema.
 * Extiende de GenericNomencladorEntity para heredar id, activo, createdAt, updatedAt, nombre, descripcion.
 * Optimizada para MongoDB con referencias de ObjectId.
 *
 * @Entity('nom_almacen') - Define la colección en MongoDB
 */
@Entity('nom_almacen')
export class AlmacenEntity extends GenericNomencladorEntity {
  /**
   * IDs de los registros diarios asociados (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["registro-id-1", "registro-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  registroDiarioIds?: string[];

  /**
   * IDs de los movimientos asociados (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["movimiento-id-1", "movimiento-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  movimientoIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (registros completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  registrosDiarios?: RegistroDiarioEntity[];

  /**
   * Propiedad de compatibilidad para el mapper (movimientos completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  movimientos?: MovimientoInventarioEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<AlmacenEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
