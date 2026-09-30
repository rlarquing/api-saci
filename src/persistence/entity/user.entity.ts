import { Column, Entity, Index } from 'typeorm';
import { hash } from 'bcryptjs';
import {
  IsArray,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { RolEntity } from './rol.entity';
import { FuncionEntity } from './funcion.entity';
import { AlmacenEntity } from './almacen.entity';

/**
 * Entidad que representa un usuario en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para referencias de ObjectId.
 *
 * @Entity('user') - Define la colección en MongoDB
 */
@Entity('user')
export class UserEntity extends GenericEntity {
  /**
   * Nombre de usuario único
   * @example "juan"
   */
  @Index({ unique: true })
  @Column({
    unique: true,
    nullable: false,
  })
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  userName: string;

  /**
   * Correo electrónico del usuario
   * @example "juan@empresa.cu"
   */
  @Index()
  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string;

  /**
   * Contraseña hasheada del usuario
   */
  @Column({ type: 'varchar', nullable: false })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  /**
   * Token de refresh para autenticación
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  refreshToken?: string;

  /**
   * Fecha de expiración del token de refresh
   */
  @Column({ type: 'date', nullable: true })
  @IsOptional()
  refreshTokenExp?: string;

  /**
   * Salt para hashear la contraseña
   */
  @Column({ type: 'varchar', nullable: true })
  @IsOptional()
  @IsString()
  salt?: string;

  /**
   * IDs de los roles asignados al usuario (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["rol-id-1", "rol-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  roleIds?: string[];

  /**
   * IDs de las funciones asignadas al usuario (referencias MongoDB)
   * Almacena los ObjectId como strings
   * @example ["funcion-id-1", "funcion-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  funcionIds?: string[];

  /**
   * Código para reset de contraseña
   */
  @Column({
    type: 'int4',
    nullable: true,
  })
  @IsOptional()
  resetPasswordCode?: number;

  /**
   * IDs de los almacenes asociados al usuario (referencias MongoDB)
   * Almacena los ObjectId como strings
   * Un usuario puede administrar múltiples almacenes
   * @example ["almacen-id-1", "almacen-id-2"]
   */
  @IsOptional()
  @IsArray()
  @Column({ type: 'varchar', array: true, nullable: true })
  @Index()
  almacenIds?: string[];

  /**
   * Propiedad de compatibilidad para el mapper (roles completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  roles?: RolEntity[];

  /**
   * Propiedad de compatibilidad para el mapper (funciones completas)
   * No se persiste en la base de datos, se usa en memoria
   */
  funciones?: FuncionEntity[];

  /**
   * Propiedad de compatibilidad para el mapper (almacenes completos)
   * No se persiste en la base de datos, se usa en memoria
   */
  almacenes?: AlmacenEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<UserEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Valida la contraseña del usuario
   */
  public async validatePassword(password: string): Promise<boolean> {
    return this.password === (await hash(password, this.salt));
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    return this.userName;
  }
}
