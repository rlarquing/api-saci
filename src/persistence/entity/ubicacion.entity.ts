import { Column, Entity } from 'typeorm';
import { ObjectId } from 'mongodb';
import { IsOptional } from 'class-validator';
import { GenericNomencladorEntity } from './generic-nomenclador.entity';

/**
 * Ubicación física dentro de un almacén (rack / estante / celda).
 * Catálogo dinámico: hereda id, activo, createdAt, updatedAt, nombre, descripcion.
 * Fase 1: informativa (donde vive el bin etiquetado); el stock por ubicación es fase 3.
 *
 * @Entity('nom_ubicacion') - Define la colección en MongoDB
 */
@Entity('nom_ubicacion')
export class UbicacionEntity extends GenericNomencladorEntity {
  /** Almacén al que pertenece la ubicación (referencia MongoDB). */
  @IsOptional()
  @Column({ nullable: true })
  almacenId?: ObjectId;

  constructor(partial?: Partial<UbicacionEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }
}
