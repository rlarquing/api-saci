import { Column, Index, Unique } from 'typeorm';
import { IsString, MaxLength, MinLength } from 'class-validator';
import { GenericEntity } from './generic.entity';

/**
 * Entidad base genérica para nomencladores del sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB.
 *
 * Los nomencladores son catálogos de valores fijos como:
 * - Tipos de usuario
 * - Estados de movimiento
 * - Categorías de productos
 *
 * @example
 * ```typescript
 * @Entity('tipo-usuario')
 * export class TipoUsuarioEntity extends GenericNomencladorEntity {
 *   // Hereda: id, activo, createdAt, updatedAt, nombre, descripcion
 * }
 * ```
 */
@Unique(['nombre'])
export class GenericNomencladorEntity extends GenericEntity {
  /**
   * Nombre único del nomenclador
   * @example "Activo"
   */
  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  nombre: string;

  /**
   * Descripción detallada del nomenclador
   * @example "Usuario con acceso completo al sistema"
   */
  @Column({ type: 'text', nullable: false })
  @IsString()
  @MaxLength(500)
  descripcion: string;

  /**
   * Constructor con parámetros para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<GenericNomencladorEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   * @returns string - El nombre del nomenclador
   */
  public toString(): string {
    return this.nombre;
  }
}
