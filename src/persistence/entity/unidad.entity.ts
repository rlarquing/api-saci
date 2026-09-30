import { Entity } from 'typeorm';
import { GenericNomencladorEntity } from './generic-nomenclador.entity';

/**
 * Unidad de medida de los productos (unidad, caja, paquete, kg...).
 * Catálogo dinámico: hereda id, activo, createdAt, updatedAt, nombre, descripcion.
 *
 * @Entity('nom_unidad') - Define la colección en MongoDB
 */
@Entity('nom_unidad')
export class UnidadEntity extends GenericNomencladorEntity {
  constructor(partial?: Partial<UnidadEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
