import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, MongoRepository } from 'typeorm';
import { NivelStockEntity } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';
import {
  Pagination,
  PaginationOptions,
  paginateMongo,
} from '../../shared/pagination';

@Injectable()
export class NivelStockRepository
  extends GenericRepository<NivelStockEntity>
  implements IRepository<NivelStockEntity>
{
  constructor(
    @InjectRepository(NivelStockEntity)
    private nivelStockRepository: MongoRepository<NivelStockEntity>,
  ) {
    super(nivelStockRepository);
  }

  /**
   * Listado filtrado de niveles (por almacén y/o producto), ordenado por
   * creación descendente en memoria (mismo patrón de conteo-inventario).
   */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    productoId?: string,
    sinPaginacion?: boolean,
  ): Promise<Pagination<NivelStockEntity> | NivelStockEntity[]> {
    const where: Record<string, unknown> = { activo: true };
    if (almacenId) where.almacenId = almacenId;
    if (productoId) where.productoId = productoId;

    const findOptions: FindManyOptions<NivelStockEntity> = {
      where: where as any,
    };

    if (sinPaginacion === true) {
      const rows = await this.nivelStockRepository.find(findOptions);
      return this.ordenarDesc(rows);
    }

    const resultado = await paginateMongo<NivelStockEntity>(
      this.nivelStockRepository,
      options,
      findOptions,
    );
    resultado.items = this.ordenarDesc(resultado.items) as any;
    return resultado;
  }

  private ordenarDesc(filas: NivelStockEntity[]): NivelStockEntity[] {
    return [...filas].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }

  /** Devuelve el nivel activo de un producto en un almacén (o null). */
  async findPorProductoYAlmacen(
    productoId: string,
    almacenId: string,
  ): Promise<NivelStockEntity | null> {
    return await this.nivelStockRepository.findOne({
      where: { productoId, almacenId, activo: true } as any,
    });
  }

  /** Todos los niveles activos de un almacén (para umbral efectivo en lote). */
  async findByAlmacen(almacenId: string): Promise<NivelStockEntity[]> {
    return await this.nivelStockRepository.find({
      where: { almacenId, activo: true } as any,
    });
  }

  /** Todos los niveles activos de una lista de almacenes (sync / digest). */
  async findByAlmacenes(almacenIds: string[]): Promise<NivelStockEntity[]> {
    if (!almacenIds || almacenIds.length === 0) return [];
    return await this.nivelStockRepository.find({
      where: { almacenId: { $in: almacenIds } as any, activo: true } as any,
    });
  }
}
