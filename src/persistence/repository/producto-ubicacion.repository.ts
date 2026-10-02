import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, MongoRepository } from 'typeorm';
import { ProductoUbicacionEntity } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';
import {
  Pagination,
  PaginationOptions,
  paginateMongo,
} from '../../shared/pagination';

@Injectable()
export class ProductoUbicacionRepository
  extends GenericRepository<ProductoUbicacionEntity>
  implements IRepository<ProductoUbicacionEntity>
{
  constructor(
    @InjectRepository(ProductoUbicacionEntity)
    private productoUbicacionRepository: MongoRepository<ProductoUbicacionEntity>,
  ) {
    super(productoUbicacionRepository);
  }

  /**
   * Listado filtrado de bins (por almacén y/o producto), ordenado por
   * creación descendente en memoria (mismo patrón de nivel-stock).
   */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    productoId?: string,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ProductoUbicacionEntity> | ProductoUbicacionEntity[]> {
    const where: Record<string, unknown> = { activo: true };
    if (almacenId) where.almacenId = almacenId;
    if (productoId) where.productoId = productoId;

    const findOptions: FindManyOptions<ProductoUbicacionEntity> = {
      where: where as any,
    };

    if (sinPaginacion === true) {
      const rows = await this.productoUbicacionRepository.find(findOptions);
      return this.ordenarDesc(rows);
    }

    const resultado = await paginateMongo<ProductoUbicacionEntity>(
      this.productoUbicacionRepository,
      options,
      findOptions,
    );
    resultado.items = this.ordenarDesc(resultado.items) as any;
    return resultado;
  }

  private ordenarDesc(filas: ProductoUbicacionEntity[]): ProductoUbicacionEntity[] {
    return [...filas].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }

  /** Devuelve el bin activo de un producto en un almacén (o null). */
  async findPorProductoYAlmacen(
    productoId: string,
    almacenId: string,
  ): Promise<ProductoUbicacionEntity | null> {
    return await this.productoUbicacionRepository.findOne({
      where: { productoId, almacenId, activo: true } as any,
    });
  }

  /** Todos los bins activos de un almacén. */
  async findByAlmacen(almacenId: string): Promise<ProductoUbicacionEntity[]> {
    return await this.productoUbicacionRepository.find({
      where: { almacenId, activo: true } as any,
    });
  }

  /** Todos los bins activos de una lista de almacenes (sync APK). */
  async findByAlmacenes(almacenIds: string[]): Promise<ProductoUbicacionEntity[]> {
    if (!almacenIds || almacenIds.length === 0) return [];
    return await this.productoUbicacionRepository.find({
      where: { almacenId: { $in: almacenIds } as any, activo: true } as any,
    });
  }

  /** Bins activos de un producto en todos sus almacenes (ficha web). */
  async findByProducto(productoId: string): Promise<ProductoUbicacionEntity[]> {
    return await this.productoUbicacionRepository.find({
      where: { productoId, activo: true } as any,
    });
  }
}
