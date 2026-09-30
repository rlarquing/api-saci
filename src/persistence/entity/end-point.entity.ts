import { Column, Entity, Index, ObjectIdColumn } from 'typeorm';
import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

import { FuncionEntity } from './funcion.entity';
import { ObjectId } from 'mongodb';

/**
 * Entidad que representa un endpoint en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para referencias de ObjectId.
 *
 * @Entity('end_point') - Define la colección en MongoDB
 */
@Entity('end_point')
export class EndPointEntity {
  /**
   * ID único de MongoDB (ObjectId)
   * Se persiste con el nombre '_id' en la colección
   * @example "507f1f77bcf86cd799439011"
   */
  @ObjectIdColumn({ name: '_id' })
  id: ObjectId;

  /**
   * Nombre del controlador
   * @example "UserController"
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @IsString()
  @MaxLength(255)
  controller: string;

  /**
   * Nombre del servicio
   * @example "users"
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @IsString()
  @MaxLength(255)
  servicio: string;

  /**
   * Ruta del endpoint
   * @example "/users"
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @IsString()
  @MaxLength(255)
  ruta: string;

  /**
   * Nombre descriptivo del endpoint
   * @example "Obtener todos los usuarios"
   */
  @Column({
    type: 'varchar',
    length: 255,
    nullable: false,
  })
  @IsString()
  @MaxLength(255)
  nombre: string;

  /**
   * Método HTTP del endpoint
   * @example "GET"
   */
  @Index()
  @Column({
    type: 'varchar',
    length: 20,
    nullable: false,
  })
  @IsString()
  @MaxLength(20)
  metodo: string;

  /**
   * IDs de las funciones que tienen este endpoint (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["funcion-id-1", "funcion-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  funcionIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (funciones completas)
   * No se persiste en la base de datos, se usa en memoria
   */
  funciones?: FuncionEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<EndPointEntity>) {
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    return this.nombre;
  }
}
