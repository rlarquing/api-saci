import { Column, Entity, Index } from 'typeorm';
import { GenericEntity } from './generic.entity';
import { TipoMenuTypeEnum } from '../../shared/enum';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

/**
 * Entidad que representa un elemento del menú en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para jerarquías mediante referencias de ObjectId.
 *
 * @Entity('menu') - Define la colección en MongoDB
 */
@Entity('menu')
export class MenuEntity extends GenericEntity {
  /**
   * Etiqueta visible del menú
   * @example "Gestión de Usuarios"
   */
  @Column({
    name: 'label',
    length: 100,
  })
  @IsString()
  @MaxLength(100)
  label: string;

  /**
   * Icono asociado al menú (clase de icono)
   * @example "user"
   */
  @Column({
    length: 50,
  })
  @IsString()
  @MaxLength(50)
  icon: string;

  /**
   * Ruta/URL del menú
   * @example "/usuarios"
   */
  @Column({
    length: 255,
  })
  @IsString()
  @MaxLength(255)
  to: string;

  /**
   * Referencia al menú padre (jerarquía de menú)
   * Almacena el ObjectId del documento padre como string
   */
  @Column({
    nullable: true,
  })
  @IsOptional()
  @IsString()
  menuId?: string;

  /**
   * Tipo de menú (interno o externo)
   * @default 'interno'
   */
  @Index()
  @Column({
    length: 20,
    default: 'interno',
  })
  @IsEnum(TipoMenuTypeEnum)
  tipo: TipoMenuTypeEnum = TipoMenuTypeEnum.INTERNO;

  /**
   * Nomenclador asociado (opcional)
   * IMPORTANTE: Mantiene el nombre 'nomenclador' por compatibilidad con código existente
   * @example "tipos-usuarios"
   */
  @Column({
    length: 255,
    nullable: true,
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nomenclador?: string;

  /**
   * Propiedad de compatibilidad para el mapper (referencia al padre)
   * No se persiste en la base de datos, se usa en memoria
   */
  padre?: MenuEntity;

  /**
   * Propiedad de compatibilidad para obtener menús hijos
   * No se persiste directamente, se consulta mediante menuId
   */
  menus?: MenuEntity[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<MenuEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  toString(): string {
    return this.label;
  }
}
