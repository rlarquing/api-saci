import { Injectable, Logger } from '@nestjs/common';
import { MovimientoInventarioService } from './movimiento-inventario.service';
import { GenericNomencladorService } from './generic-nomenclador.service';
import {
  NivelStockRepository,
  ProductoUbicacionRepository,
} from '../../persistence/repository';
import { ProductoRepository, MovimientoInventarioRepository } from '../../persistence/repository';
import { ProductoEntity, UserEntity } from '../../persistence/entity';
import {
  SyncRequestDto,
  SyncResponseDto,
  SyncErrorDto,
  ProductoSyncDto,
  StockSyncDto,
  CategoriaSyncDto,
  NivelStockSyncDto,
  UbicacionProductoSyncDto,
  LoteProximoSyncDto,
} from '../../shared/dto';
import { NomencladorTypeEnum } from '../../shared/enum';

/**
 * Sincronización offline del escáner (heredada de SACP): recibe movimientos
 * pendientes, los procesa ÍTEM POR ÍTEM con el servicio de inventario y
 * devuelve errores específicos + catálogos refrescados (productos, stock del
 * almacén y categorías).
 */
@Injectable()
export class SyncService {
  private readonly logger = new Logger(SyncService.name);

  constructor(
    protected movimientoInventarioService: MovimientoInventarioService,
    protected genericNomencladorService: GenericNomencladorService,
    protected productoRepository: ProductoRepository,
    protected movimientoInventarioRepository: MovimientoInventarioRepository,
    protected nivelStockRepository: NivelStockRepository,
    protected productoUbicacionRepository: ProductoUbicacionRepository,
  ) {}

  async sincronizar(
    user: UserEntity,
    request: SyncRequestDto,
    ip: string,
  ): Promise<SyncResponseDto> {
    const errores: SyncErrorDto[] = [];
    let movimientosSincronizados = 0;
    let movimientosConError = 0;

    this.logger.log(
      `Iniciando sincronización para usuario ${user.userName} con ${request.movimientosPendientes.length} movimientos pendientes`,
    );

    for (const pendiente of request.movimientosPendientes) {
      try {
        if (pendiente.operacion === 'entrada') {
          await this.movimientoInventarioService.entrada(user, pendiente.data, ip);
        } else if (pendiente.operacion === 'salida') {
          await this.movimientoInventarioService.salida(user, pendiente.data, ip);
        }
        movimientosSincronizados++;
      } catch (error) {
        movimientosConError++;
        errores.push({
          id: pendiente.id,
          operacion: pendiente.operacion,
          error: error.message || 'Error desconocido',
        });
        this.logger.error(
          `Error sincronizando ${pendiente.operacion} ${pendiente.id}: ${error.message}`,
        );
      }
    }

    const { productos, stock, categorias, niveles, bins, lotesProximos } =
      await this.obtenerDatosActualizados(user);

    return {
      exito: true,
      movimientosSincronizados,
      movimientosConError,
      datosActualizados: {
        productos: productos.length,
        categorias: categorias.length,
      },
      errores,
      productos,
      stock,
      categorias,
      niveles,
      bins,
      lotesProximos,
    };
  }

  /** Productos activos + stock del usuario + categorías + niveles + bins + lotes (P3). */
  private async obtenerDatosActualizados(user: UserEntity): Promise<{
    productos: ProductoSyncDto[];
    stock: StockSyncDto[];
    categorias: CategoriaSyncDto[];
    niveles: NivelStockSyncDto[];
    bins: UbicacionProductoSyncDto[];
    lotesProximos: LoteProximoSyncDto[];
  }> {
    // Productos activos
    const productosEntities = (await this.productoRepository.findAll(
      {} as any,
      true,
    )) as ProductoEntity[];
    const productos: ProductoSyncDto[] = productosEntities.map((p) => ({
      id: p.getIdString(),
      codigo: p.codigo,
      nombre: p.nombre,
      categoriaId: p.categoriaId,
      categoriaNombre: p.categoriaNombre,
      unidadNombre: p.unidadNombre,
      stockMinimo: p.stockMinimo,
      stockSeguridad: p.stockSeguridad ?? 0,
      activo: p.activo,
      updatedAt: p.updatedAt?.toISOString() || new Date().toISOString(),
    }));

    // Stock del primer almacén del usuario (el escáner opera por almacén)
    const stock: StockSyncDto[] = [];
    for (const almacenId of user.almacenIds ?? []) {
      const filas = await this.movimientoInventarioRepository.calcularStock(
        undefined,
        almacenId,
      );
      for (const fila of filas) {
        stock.push({
          productoId: fila.productoId,
          almacenId: fila.almacenId,
          stock: fila.stock,
        });
      }
    }

    // Niveles de stock por producto/almacén (safety stock — backlog P2)
    const nivelesEntities =
      await this.nivelStockRepository.findByAlmacenes(user.almacenIds ?? []);
    const niveles: NivelStockSyncDto[] = nivelesEntities.map((n) => ({
      productoId: n.productoId,
      almacenId: n.almacenId,
      stockMinimo: n.stockMinimo,
      stockSeguridad: n.stockSeguridad,
    }));

    // Bins producto→almacén (ubicación interna — backlog P3)
    const binsEntities =
      await this.productoUbicacionRepository.findByAlmacenes(
        user.almacenIds ?? [],
      );
    const bins: UbicacionProductoSyncDto[] = binsEntities.map((b) => ({
      productoId: b.productoId,
      almacenId: b.almacenId,
      ubicacionNombre: b.ubicacionNombre,
    }));

    // Lotes vencidos o por vencer en 30 días (alertas — backlog P3)
    let lotesProximos: LoteProximoSyncDto[] = [];
    try {
      const filasLotes = await this.movimientoInventarioService.lotesProximosAVencer(
        user.almacenIds ?? [],
        30,
      );
      lotesProximos = filasLotes.map((l) => ({
        productoId: l.productoId,
        productoCodigo: l.productoCodigo,
        productoNombre: l.productoNombre,
        lote: l.lote ?? '(sin lote)',
        fechaCaducidad: l.fechaCaducidad
          ? new Date(l.fechaCaducidad).toISOString()
          : null,
        stock: l.stock,
        diasParaVencer: l.diasParaVencer ?? 0,
      }));
    } catch {
      lotesProximos = [];
    }

    // Categorías
    const categoriasEntities =
      await this.genericNomencladorService.findAllEntities(
        NomencladorTypeEnum.CATEGORIA,
      );
    const categorias: CategoriaSyncDto[] = categoriasEntities.map((t: any) => ({
      id: t.id,
      nombre: t.nombre,
      descripcion: t.descripcion || null,
      activo: t.activo,
      createdAt: t.createdAt || new Date().toISOString(),
      updatedAt: t.updatedAt || new Date().toISOString(),
    }));

    return { productos, stock, categorias, niveles, bins, lotesProximos };
  }

  async getEstado(): Promise<{ ultimaSincronizacion: string | null }> {
    return { ultimaSincronizacion: null };
  }
}
