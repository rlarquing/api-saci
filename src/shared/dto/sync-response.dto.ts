import { SyncErrorDto } from './sync-error.dto';
import { ProductoSyncDto } from './producto-sync.dto';
import { StockSyncDto } from './stock-sync.dto';
import { CategoriaSyncDto } from './categoria-sync.dto';
import { NivelStockSyncDto } from './nivel-stock-sync.dto';

export class SyncResponseDto {
  exito: boolean;
  movimientosSincronizados: number;
  movimientosConError: number;
  datosActualizados: {
    productos: number;
    categorias: number;
  };
  errores: SyncErrorDto[];
  productos: ProductoSyncDto[];
  stock: StockSyncDto[];
  categorias: CategoriaSyncDto[];
  niveles: NivelStockSyncDto[];
}
