import { Column, Entity, Index } from 'typeorm';
import {
  IsArray,
  IsDateString,
  IsNumber,
  IsString,
  Max,
  ValidateNested,
} from 'class-validator';
import { GenericEntity } from './generic.entity';
import { AlmacenEntity } from './almacen.entity';
import { Type } from 'class-transformer';
import { DetalleTiposDto } from '../../shared/dto';
/**
 * Entidad que representa un registro diario de almacen en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con referencias de ObjectId.
 *
 * @Entity('registro_diario') - Define la colección en MongoDB
 */
@Entity('registro_diario')
export class RegistroDiarioEntity extends GenericEntity {
  /**
   * Fecha del registro
   * @example "2024-01-15"
   */
  @Index()
  @Column({
    type: 'date',
  })
  @IsDateString()
  fecha: Date;

  /**
   * ID del almacen (referencia MongoDB)
   * @example "almacen-id-123"
   */
  @Index()
  @Column({
    nullable: false,
  })
  @IsString()
  almacenId: string;

  /**
   * Propiedad de compatibilidad para el mapper (almacen completo)
   * No se persiste en la base de datos, se usa en memoria
   */
  almacen?: AlmacenEntity;

  /**
   * Estado del registro
   * @example "cerrado"
   */
  @Column()
  @IsString()
  @Max(50)
  estado: string;

  /**
   * Total de unidades ENTRADAS en el día
   * @example 150
   */
  @Column({
    type: 'float',
    default: 0,
  })
  @IsNumber()
  @Max(999999999.99)
  totalEntradas: number;

  /**
   * Total de unidades SALIDAS en el día
   * @example 90
   */
  @Column({
    type: 'float',
    default: 0,
  })
  @IsNumber()
  @Max(999999999.99)
  totalSalidas: number;

  /**
   * Detalle por categorías (entradas/salidas)
   */
  @Column({
    type: 'simple-json',
    default: [],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DetalleTiposDto)
  detalleCategorias: DetalleTiposDto[];

  /**
   * Constructor con parámetros opcionales para creación flexible
   * Soporta el formato antiguo para compatibilidad
   */
  constructor(partial?: Partial<RegistroDiarioEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    const almacenStr = this.almacen?.toString();
    return `${this.fecha.toDateString()} ${almacenStr}`;
  }
}
