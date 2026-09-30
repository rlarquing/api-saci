import {
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ObjectIdColumn,
  Index,
} from 'typeorm';
import { ObjectId } from 'mongodb';
import { IsBoolean, IsOptional } from 'class-validator';

/**
 * Entidad base abstracta para todas las entidades del sistema.
 * Proporciona campos comunes como id, activo, createdAt y updatedAt.
 * Diseñada específicamente para MongoDB con ObjectId como clave primaria.
 *
 * Todas las entidades que extienden esta clase heredan:
 * - id: ObjectId único
 * - activo: indicador de registro activo
 * - createdAt: fecha de creación
 * - updatedAt: fecha de última modificación
 *
 * @example
 * ```typescript
 * @Entity('users')
 * export class UserEntity extends GenericEntity {
 *   @Column()
 *   name: string;
 * }
 * ```
 */
export abstract class GenericEntity {
  /**
   * ID único de MongoDB (ObjectId)
   * Se persiste con el nombre '_id' en la colección
   * @example "507f1f77bcf86cd799439011"
   */
  @ObjectIdColumn({ name: '_id' })
  id: ObjectId;

  /**
   * Indicador de si el registro está activo
   * Se usa para soft-delete en lugar de eliminar documentos
   * @default true
   */
  @Index()
  @Column({ default: true })
  @IsBoolean()
  @IsOptional()
  activo: boolean = true;

  /**
   * Fecha de creación del registro
   * Se establece automáticamente por TypeORM
   */
  @Index()
  @CreateDateColumn({ nullable: true })
  @IsOptional()
  createdAt: Date;

  /**
   * Fecha de última modificación del registro
   * Se actualiza automáticamente por TypeORM
   */
  @UpdateDateColumn({ nullable: true })
  @IsOptional()
  updatedAt: Date;

  // ============ MÉTODOS UTILITARIOS ============

  /**
   * Obtiene el ID como string hexadecimal
   * Útil para serialización en respuestas HTTP
   * @returns string - Representación hexadecimal del ObjectId
   * @example "507f1f77bcf86cd799439011"
   */
  getIdString(): string | undefined {
    return this.id?.toHexString();
  }

  /**
   * Verifica si es un nuevo documento (sin ID asignado)
   * Útil para determinar si se debe crear o actualizar
   * @returns boolean - true si no tiene ID
   */
  isNew(): boolean {
    return !this.id;
  }

  /**
   * Representación en string de la entidad
   * Por defecto retorna el ID en hex
   * @returns string
   */
  toString(): string {
    return this.getIdString() ?? '';
  }

  /**
   * Convierte la entidad a un objeto plano (plain object)
   * Útil para respuestas HTTP y serialización
   * Excluye el ObjectId internoy lo reemplaza por string
   * @returns Record<string, unknown> - Objeto serializable
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this.getIdString(),
      activo: this.activo,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }

  /**
   * Constructor base con parámetros opcionales
   * Permite crear instancias parciales de la entidad
   * @param partial - Objeto parcial con las propiedades a inicializar
   */
  constructor(partial?: Partial<GenericEntity>) {
    if (partial) {
      Object.assign(this, partial);
    }
  }
}
