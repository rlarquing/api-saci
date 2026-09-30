import { Type } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { MovimientoPendienteSyncDto } from './movimiento-pendiente-sync.dto';

export class SyncRequestDto {
  @ValidateNested({ each: true })
  @Type(() => MovimientoPendienteSyncDto)
  @ArrayNotEmpty()
  movimientosPendientes: MovimientoPendienteSyncDto[];

  @IsOptional()
  @IsString()
  ultimaSincronizacion: string | null;
}
