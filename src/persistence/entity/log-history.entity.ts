import { Column, CreateDateColumn, Entity, Index } from 'typeorm';
import {
  IsEnum,
  IsOptional,
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { GenericEntity } from './generic.entity';

/**
 * Enum para las acciones del historial
 */
export enum HISTORY_ACTION {
  ADD = 'Adicionar',
  MOD = 'Modificar',
  DEL = 'Eliminar',
  REM = 'Eliminar_completamente',
}

/**
 * Entidad que representa un registro de historial en el sistema.
 * Extiende de GenericEntity para heredar id, activo, createdAt, updatedAt.
 * Optimizada para MongoDB con soporte para referencias de ObjectId.
 *
 * @Entity('log_history') - Define la colección en MongoDB
 */
@Entity('log_history')
export class LogHistoryEntity extends GenericEntity {
  /**
   * Nombre del usuario
   * @example "Juan"
   */
  @Column()
  @IsString()
  @MaxLength(100)
  user: string;

  /**
   * Fecha de la acción
   * @example "2024-01-15T10:30:00Z"
   */
  @CreateDateColumn({ type: 'timestamp', name: 'date', nullable: true })
  date: Date;

  /**
   * Nombre del tabla afectada
   * @example "User"
   */
  @Column()
  @IsString()
  @MaxLength(100)
  tabla: string;

  /**
   * Datos nuevos (para auditoría)
   */
  @Column('simple-json', { nullable: true })
  @IsOptional()
  @IsObject()
  valorNuevo?: object;

  /**
   * Datos viejos (para auditoría)
   */
  @Column('simple-json', { nullable: true })
  @IsOptional()
  @IsObject()
  valorAnterior?: object | null;

  /**
   * ID del registro afectado
   * @example "record-id-123"
   */
  @Column({ nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  registroId?: string;

  /**
   * Direccion IP
   * @example "192.168.1.1"
   */
  @Column()
  @IsString()
  @MaxLength(100)
  direccionIp?: string | null;

  /**
   * Acción realizada
   */
  @Index()
  @Column()
  @IsEnum(HISTORY_ACTION)
  action: HISTORY_ACTION;

  /**
   * Constructor con parámetros opcionales para creación flexible
   */
  constructor(partial?: Partial<LogHistoryEntity>) {
    super();
    Object.assign(this, partial ?? {});
  }

  /**
   * Representación en string de la entidad
   */
  public toString(): string {
    return `${this.tabla} - ${this.action}`;
  }
}
