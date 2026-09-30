import { Injectable } from '@nestjs/common';
import {
  MovimientoInventarioRepository,
  ProductoRepository,
} from '../../persistence/repository';
import { GenericNomencladorRepository } from '../../persistence/repository';
import { TipoMovimiento, UserEntity } from '../../persistence/entity';
import { NomencladorTypeEnum, RolType } from '../../shared/enum';
import {
  BajoMinimoBiDto,
  ComparativaAlmacenesBiDto,
  DashboardBiDto,
  TendenciaBiDto,
} from '../../shared/dto';

/**
 * BI de inventario (SACI fase 1): dashboard de stock y movimientos.
 * La fuente de verdad del dinero en SACP era el RegistroDiario; aquí la fuente
 * de verdad del stock es la agregación de movimiento_inventario.
 */
@Injectable()
export class BiService {
  constructor(
    protected movimientoInventarioRepository: MovimientoInventarioRepository,
    protected productoRepository: ProductoRepository,
    protected genericNomencladorRepository: GenericNomencladorRepository,
  ) {}

  /** Filtra los almacenes accesibles según el rol del usuario. */
  private async filtrarAlmacenesUsuario(
    user: UserEntity,
    almacenId?: string,
  ): Promise<string[]> {
    const esAdmin = user.roles?.some(
      (r: any) => r.nombre === RolType.ADMINISTRADOR,
    );
    if (almacenId) {
      if (esAdmin || user.almacenIds?.includes(almacenId)) return [almacenId];
      return [];
    }
    if (esAdmin) {
      const todos = await this.genericNomencladorRepository.findAllEntities(
        NomencladorTypeEnum.ALMACEN,
      );
      return todos.map((a: any) => a.id);
    }
    return user.almacenIds ?? [];
  }

  private rangoDelDia(): { inicio: Date; fin: Date } {
    const inicio = new Date();
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date();
    fin.setHours(23, 59, 59, 999);
    return { inicio, fin };
  }

  async dashboard(user: UserEntity): Promise<DashboardBiDto> {
    const almacenIds = await this.filtrarAlmacenesUsuario(user);
    const stockFilas =
      await this.movimientoInventarioRepository.calcularStock();
    const propias = stockFilas.filter((f) => almacenIds.includes(f.almacenId));

    const stockPorAlmacenMap = new Map<string, number>();
    for (const fila of propias) {
      stockPorAlmacenMap.set(
        fila.almacenId,
        (stockPorAlmacenMap.get(fila.almacenId) ?? 0) + fila.stock,
      );
    }
    const stockPorAlmacen: Array<any> = [];
    for (const [almacenId, stock] of stockPorAlmacenMap) {
      const almacen = await this.genericNomencladorRepository
        .findById(NomencladorTypeEnum.ALMACEN, almacenId)
        .catch(() => null);
      stockPorAlmacen.push({
        almacenId,
        almacenNombre: almacen?.nombre ?? '—',
        stock,
      });
    }

    const { inicio, fin } = this.rangoDelDia();
    let entradasHoy = 0;
    let salidasHoy = 0;
    const ultimos: Array<any> = [];
    for (const almacenId of almacenIds.slice(0, 10)) {
      const delDia = await this.movimientoInventarioRepository.movimientosDelDia(
        almacenId,
        new Date(),
      );
      for (const m of delDia) {
        if (m.tipo === TipoMovimiento.ENTRADA) entradasHoy += m.cantidad;
        if (m.tipo === TipoMovimiento.SALIDA) salidasHoy += m.cantidad;
      }
    }

    const paginado = await this.movimientoInventarioRepository.findAll({
      page: 1,
      limit: 10,
      route: '/api/bi',
    } as any);
    for (const m of (paginado as any).items ?? []) {
      ultimos.push({
        id: m.getIdString(),
        tipo: m.tipo,
        productoCodigo: m.productoCodigo,
        productoNombre: m.productoNombre,
        cantidad: m.cantidad,
        almacenNombre: m.almacenNombre,
        userName: m.userName,
        fecha: m.fecha,
      });
    }

    const totalProductos = await this.productoRepository.contarProductos();
    const alertas = await this.movimientoInventarioService_bajoMinimo(almacenIds);

    return {
      totalProductos,
      totalAlmacenes: almacenIds.length,
      stockTotal: propias.reduce((acc, f) => acc + f.stock, 0),
      entradasHoy,
      salidasHoy,
      alertasBajoMinimo: alertas.length,
      stockPorAlmacen,
      ultimosMovimientos: ultimos,
    };
  }

  async comparativaAlmacenes(
    user: UserEntity,
    fechaInicio?: string,
    fechaFin?: string,
  ): Promise<ComparativaAlmacenesBiDto> {
    const almacenIds = await this.filtrarAlmacenesUsuario(user);
    const inicio = fechaInicio
      ? new Date(fechaInicio)
      : new Date(Date.now() - 30 * 86400000);
    const fin = fechaFin ? new Date(fechaFin) : new Date();
    const almacenes: Array<any> = [];
    for (const almacenId of almacenIds) {
      const movs =
        await this.movimientoInventarioRepository.movimientosDelDia(
          almacenId,
          inicio,
        );
      // movimientosDelDia devuelve solo el día; para el rango filtramos por fecha
      const delRango = movs.filter((m) => m.fecha >= inicio && m.fecha <= fin);
      let entradas = 0;
      let salidas = 0;
      for (const m of delRango) {
        if (m.tipo === TipoMovimiento.ENTRADA || (m.tipo === TipoMovimiento.AJUSTE && m.signoAjuste === 1))
          entradas += m.cantidad;
        if (m.tipo === TipoMovimiento.SALIDA || (m.tipo === TipoMovimiento.AJUSTE && m.signoAjuste === -1))
          salidas += m.cantidad;
      }
      const almacen = await this.genericNomencladorRepository
        .findById(NomencladorTypeEnum.ALMACEN, almacenId)
        .catch(() => null);
      almacenes.push({
        almacenId,
        almacenNombre: almacen?.nombre ?? '—',
        entradas,
        salidas,
        movimientos: delRango.length,
      });
    }
    void fin;
    return { almacenes };
  }

  async tendencia(
    user: UserEntity,
    dias = 14,
  ): Promise<TendenciaBiDto> {
    const almacenIds = await this.filtrarAlmacenesUsuario(user);
    const puntos: Array<{ fecha: string; entradas: number; salidas: number }> = [];
    for (let i = dias - 1; i >= 0; i--) {
      const dia = new Date();
      dia.setDate(dia.getDate() - i);
      let entradas = 0;
      let salidas = 0;
      for (const almacenId of almacenIds) {
        const movs =
          await this.movimientoInventarioRepository.movimientosDelDia(
            almacenId,
            dia,
          );
        for (const m of movs) {
          if (m.tipo === TipoMovimiento.ENTRADA) entradas += m.cantidad;
          if (m.tipo === TipoMovimiento.SALIDA) salidas += m.cantidad;
        }
      }
      puntos.push({
        fecha: dia.toISOString().split('T')[0],
        entradas,
        salidas,
      });
    }
    return { puntos };
  }

  async bajoMinimo(user: UserEntity): Promise<BajoMinimoBiDto> {
    const almacenIds = await this.filtrarAlmacenesUsuario(user);
    const alertas = await this.movimientoInventarioService_bajoMinimo(almacenIds);
    return { alertas };
  }

  /** Reutiliza el cálculo del service de movimientos vía instancia propia mínima. */
  private async movimientoInventarioService_bajoMinimo(
    almacenIds: string[],
  ): Promise<Array<any>> {
    const alertas: Array<any> = [];
    for (const almacenId of almacenIds) {
      const filas =
        await this.movimientoInventarioRepository.calcularStock(
          undefined,
          almacenId,
        );
      for (const fila of filas) {
        const producto = await this.productoRepository
          .findById(fila.productoId)
          .catch(() => null);
        if (producto && fila.stock < producto.stockMinimo) {
          alertas.push({
            productoId: fila.productoId,
            productoCodigo: fila.productoCodigo,
            productoNombre: fila.productoNombre,
            almacenId: fila.almacenId,
            almacenNombre: fila.almacenNombre,
            stock: fila.stock,
            stockMinimo: producto.stockMinimo,
          });
        }
      }
    }
    return alertas;
  }
}
