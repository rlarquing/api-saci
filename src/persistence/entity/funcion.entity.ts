import { Column, Entity, Index } from 'typeorm';
import { GenericEntity } from './generic.entity';
import { IsString, IsOptional, IsArray, MaxLength } from 'class-validator';

import { EndPointEntity } from './end-point.entity';

import { MenuEntity } from './menu.entity';

/**
 * Entidad que representa una función en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para referencias mediante ObjectId como strings.
 *
 * Las relaciones se manejan mediante arrays de IDs en lugar de @ManyToMany de TypeORM.
 *
 * @Entity('funcion') - Define la colección en MongoDB
 */
@Entity('funcion')
export class FuncionEntity extends GenericEntity {
  /**
   * Nombre de la función
   * @example "Crear usuarios"
   */
  @Index()
  @Column({
    length: 100,
  })
  @IsString()
  @MaxLength(100)
  nombre: string;

  /**
   * Descripción de la función
   * @example "Permite crear nuevos usuarios en el sistema"
   */
  @Column({
    length: 500,
  })
  @IsString()
  @MaxLength(500)
  descripcion: string;

  /**
   * Referencia al menú asociado (opcional)
   * Almacena el ObjectId del documento de menú como string
   */
  @Column({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  menuId?: string;

  /**
   * IDs de las enpoints asignadas a la funcion (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["endpoint-id-1", "endpoint-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  endPointIds?: string[];

  /**
   * IDs de los usuarios asignadas a la funcion (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["usuario-id-1", "usuario-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  userIds?: string[];

  /**
   * IDs de los roles asignadas a la funcion (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["rol-id-1", "rol-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  roleIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (almacen completo)
   * No se persiste en la base de datos, se usa en memoria
   */
  menu?: MenuEntity;

  /**
   * Propiedad de compatibilidad para el mapper (endpoint completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  endPoints?: EndPointEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<FuncionEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  toString(): string {
    return this.nombre;
  }
}
