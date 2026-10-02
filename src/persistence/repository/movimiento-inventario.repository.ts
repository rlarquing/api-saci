import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, MongoRepository } from 'typeorm';
import { MovimientoInventarioEntity, TipoMovimiento } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';
import {
  Pagination,
  PaginationOptions,
  paginateMongo,
} from '../../shared/pagination';

const SALIDAS = [TipoMovimiento.SALIDA];
const ENTRADAS = [TipoMovimiento.ENTRADA];

@Injectable()
export class MovimientoInventarioRepository
  extends GenericRepository<MovimientoInventarioEntity>
  implements IRepository<MovimientoInventarioEntity>
{
  constructor(
    @InjectRepository(MovimientoInventarioEntity)
    movimientoRepository: MongoRepository<MovimientoInventarioEntity>,
  ) {
    super(movimientoRepository);
  }

  /**
   * Stock actual por producto y/o almacén.
   * @param productoId SKU ObjectId (opcional)
   * @param almacenId almacén (opcional)
   * @returns filas con {productoId, almacenId, stock, denormalizados}
   */
  async calcularStock(
    productoId?: string,
    almacenId?: string,
  ): Promise<
    Array<{
      productoId: string;
      almacenId: string;
      productoNombre: string;
      productoCodigo: string;
      almacenNombre: string;
      stock: number;
    }>
  > {
    const match: any = {};
    if (productoId) match.productoId = productoId;
    if (almacenId) match.almacenId = almacenId;

    // AJUSTE: los ajustes negativos se persisten con tipo AJUSTE y cantidad positiva
    // + observación; para la agregación los convertimos a negativo vía 'signo'.
    const pipeline: any[] = [
      { $match: { ...match, activo: true } },
      {
        $addFields: {
          signo: {
            $switch: {
              branches: [
                { case: { $eq: ['$tipo', TipoMovimiento.ENTRADA] }, then: 1 },
                { case: { $eq: ['$tipo', TipoMovimiento.SALIDA] }, then: -1 },
                {
                  case: { $eq: ['$tipo', TipoMovimiento.AJUSTE] },
                  then: { $cond: [{ $eq: ['$signoAjuste', -1] }, -1, 1] },
                },
                { case: { $eq: ['$tipo', TipoMovimiento.TRASLADO] }, then: 0 },
              ],
              default: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: { productoId: '$productoId', almacenId: '$almacenId' },
          productoNombre: { $first: '$productoNombre' },
          productoCodigo: { $first: '$productoCodigo' },
          almacenNombre: { $first: '$almacenNombre' },
          stock: { $sum: { $multiply: ['$cantidad', '$signo'] } },
        },
      },
    ];

    const rows = await this.repository.aggregate(pipeline).toArray();
    return rows.map((r: any) => ({
      productoId: r._id?.productoId,
      almacenId: r._id?.almacenId,
      productoNombre: r.productoNombre,
      productoCodigo: r.productoCodigo,
      almacenNombre: r.almacenNombre,
      stock: r.stock ?? 0,
    }));
  }

  /**
   * Stock derivado por LOTE (backlog P3): misma semántica de signos que
   * calcularStock (ENTRADA +1, SALIDA -1, AJUSTE ±1, TRASLADO 0) pero
   * agrupando por (producto, almacén, lote, fechaCaducidad). Los movimientos
   * sin lote forman el grupo lote=null («sin lote»). Σ lotes = stock total.
   */
  async stockPorLote(
    productoId?: string,
    almacenId?: string,
  ): Promise<
    Array<{
      productoId: string;
      almacenId: string;
      productoNombre: string;
      productoCodigo: string;
      almacenNombre: string;
      lote: string | null;
      fechaCaducidad: Date | null;
      stock: number;
    }>
  > {
    const match: any = { activo: true };
    if (productoId) match.productoId = productoId;
    if (almacenId) match.almacenId = almacenId;

    const pipeline: any[] = [
      { $match: match },
      {
        $addFields: {
          signo: {
            $switch: {
              branches: [
                { case: { $eq: ['$tipo', TipoMovimiento.ENTRADA] }, then: 1 },
                { case: { $eq: ['$tipo', TipoMovimiento.SALIDA] }, then: -1 },
                {
                  case: { $eq: ['$tipo', TipoMovimiento.AJUSTE] },
                  then: { $cond: [{ $eq: ['$signoAjuste', -1] }, -1, 1] },
                },
                { case: { $eq: ['$tipo', TipoMovimiento.TRASLADO] }, then: 0 },
              ],
              default: 0,
            },
          },
        },
      },
      {
        $group: {
          _id: {
            productoId: '$productoId',
            almacenId: '$almacenId',
            lote: '$lote',
            fechaCaducidad: '$fechaCaducidad',
          },
          productoNombre: { $first: '$productoNombre' },
          productoCodigo: { $first: '$productoCodigo' },
          almacenNombre: { $first: '$almacenNombre' },
          stock: { $sum: { $multiply: ['$cantidad', '$signo'] } },
        },
      },
    ];

    const rows = await this.repository.aggregate(pipeline).toArray();
    return rows.map((r: any) => ({
      productoId: r._id?.productoId,
      almacenId: r._id?.almacenId,
      productoNombre: r.productoNombre,
      productoCodigo: r.productoCodigo,
      almacenNombre: r.almacenNombre,
      lote: r._id?.lote ?? null,
      fechaCaducidad: r._id?.fechaCaducidad ?? null,
      stock: r.stock ?? 0,
    }));
  }

  /** Stock de un producto en un almacén (0 si no hay movimientos). */
  async stockDe(productoId: string, almacenId: string): Promise<number> {
    const rows = await this.calcularStock(productoId, almacenId);
    return rows.length > 0 ? rows[0].stock : 0;
  }

  /** Últimos movimientos de un QR (kardex de la etiqueta). */
  async findByQrCodigo(
    qrCodigo: string,
    limite = 50,
  ): Promise<MovimientoInventarioEntity[]> {
    return await this.repository.find({
      where: { qrCodigo, activo: true } as any,
      order: { fecha: 'DESC' as any },
      take: limite,
    });
  }

  /** Movimientos de un día (para el registro diario). */
  async movimientosDelDia(
    almacenId: string,
    fecha: Date,
  ): Promise<MovimientoInventarioEntity[]> {
    const inicio = new Date(fecha);
    inicio.setHours(0, 0, 0, 0);
    const fin = new Date(fecha);
    fin.setHours(23, 59, 59, 999);
    return await this.repository.find({
      where: {
        almacenId,
        activo: true,
        fecha: { $gte: inicio, $lte: fin } as any,
      } as any,
      order: { fecha: 'ASC' as any },
    });
  }

  /** Movimientos de una fecha y almacén que escanean un QR concreto (batch). */
  async findByCodigosQr(
    codigos: string[],
    limite = 500,
  ): Promise<MovimientoInventarioEntity[]> {
    if (!codigos || codigos.length === 0) return [];
    return await this.repository.find({
      where: { qrCodigo: { $in: codigos } as any, activo: true } as any,
      order: { fecha: 'DESC' as any },
      take: limite,
    });
  }

  /** Listado plano para exportación CSV (filtros opcionales, tope de filas). */
  async listarExportacion(
    almacenId?: string,
    tipo?: string,
    max = 10000,
  ): Promise<MovimientoInventarioEntity[]> {
    const where: Record<string, unknown> = { activo: true };
    if (almacenId) where.almacenId = almacenId;
    if (tipo) where.tipo = tipo;
    return await this.repository.find({
      where: where as any,
      order: { fecha: 'DESC' as any },
      take: max,
    });
  }

  /**
   * Kardex paginado con filtros por producto y/o almacén (timeline — P2).
   * Los índices de productoId y fecha ya existen en la colección.
   */
  async listarFiltrado(
    options: PaginationOptions,
    productoId?: string,
    almacenId?: string,
  ): Promise<Pagination<MovimientoInventarioEntity>> {
    const where: Record<string, unknown> = { activo: true };
    if (productoId) where.productoId = productoId;
    if (almacenId) where.almacenId = almacenId;

    return await paginateMongo<MovimientoInventarioEntity>(
      this.repository,
      options,
      {
        where: where as any,
        order: { fecha: 'DESC' as any },
      },
    );
  }
}
