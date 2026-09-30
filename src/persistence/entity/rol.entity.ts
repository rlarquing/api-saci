import { Column, Entity, Index } from 'typeorm';
import {
  IsArray,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { FuncionEntity } from './funcion.entity';
import { UserEntity } from './user.entity';

/**
 * Entidad que representa un rol en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para referencias de ObjectId.
 *
 * @Entity('rol') - Define la colección en MongoDB
 */
@Entity('rol')
export class RolEntity extends GenericEntity {
  /**
   * Nombre único del rol
   * @example "ADMINISTRADOR"
   */
  @Index({ unique: true })
  @Column({ unique: true, nullable: false })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  nombre: string;

  /**
   * Descripción del rol
   * @example "Usuario con acceso total al sistema"
   */
  @Column({ type: 'text', nullable: false })
  @IsString()
  @MaxLength(255)
  descripcion: string;

  /**
   * IDs de los usuarios que tienen este rol (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["user-id-1", "user-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  userIds?: string[];

  /**
   * IDs de las funciones asociadas a este rol (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["funcion-id-1", "funcion-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  funcionIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (usuarios completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  users?: UserEntity[];

  /**
   * Propiedad de compatibilidad para el mapper (funciones completas)
   * No se persiste en la base de datos, se usa en memoria
   */
  funciones?: FuncionEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<RolEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    return this.nombre;
  }
}
