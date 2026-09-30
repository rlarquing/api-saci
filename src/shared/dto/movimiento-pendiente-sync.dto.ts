import { IsDateString, IsIn, IsObject, IsString } from 'class-validator';

export class MovimientoPendienteSyncDto {
  @IsString()
  id: string;

  @IsIn(['entrada', 'salida'])
  operacion: 'entrada' | 'salida';

  @IsObject()
  data: {
    qrCodigo?: string;
    almacen?: string;
    movimiento?: string;
  };

  @IsDateString()
  createdAt: string;
}
