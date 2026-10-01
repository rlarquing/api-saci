import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, MongoRepository } from 'typeorm';
import { ConteoInventarioEntity, EstadoConteo } from '../entity';
import { GenericRepository } from './generic.repository';
import { IRepository } from '../../shared/interface';
import {
  Pagination,
  PaginationOptions,
  paginateMongo,
} from '../../shared/pagination';

@Injectable()
export class ConteoInventarioRepository
  extends GenericRepository<ConteoInventarioEntity>
  implements IRepository<ConteoInventarioEntity>
{
  constructor(
    @InjectRepository(ConteoInventarioEntity)
    private conteoInventarioRepository: MongoRepository<ConteoInventarioEntity>,
  ) {
    super(conteoInventarioRepository);
  }

  /**
   * Listado filtrado de conteos (almacén y/o estado), ordenado por creación
   * descendente (el orden se aplica en memoria para no depender del driver).
   */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    estado?: string,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ConteoInventarioEntity> | ConteoInventarioEntity[]> {
    const where: Record<string, unknown> = { activo: true };
    if (almacenId) where.almacenId = almacenId;
    if (estado) where.estado = estado;

    const findOptions: FindManyOptions<ConteoInventarioEntity> = {
      where: where as any,
    };

    if (sinPaginacion === true) {
      const rows = await this.conteoInventarioRepository.find(findOptions);
      return this.ordenarDesc(rows);
    }

    const resultado = await paginateMongo<ConteoInventarioEntity>(
      this.conteoInventarioRepository,
      options,
      findOptions,
    );
    resultado.items = this.ordenarDesc(resultado.items) as any;
    return resultado;
  }

  private ordenarDesc(
    filas: ConteoInventarioEntity[],
  ): ConteoInventarioEntity[] {
    return [...filas].sort(
      (a, b) =>
        new Date(b.createdAt ?? 0).getTime() -
        new Date(a.createdAt ?? 0).getTime(),
    );
  }

  /** Devuelve el conteo ABIERTO de un almacén (o null). Regla: 1 abierto por almacén. */
  async findAbiertoPorAlmacen(
    almacenId: string,
  ): Promise<ConteoInventarioEntity | null> {
    return await this.conteoInventarioRepository.findOne({
      where: {
        almacenId,
        estado: EstadoConteo.ABIERTO,
        activo: true,
      } as any,
    });
  }

  /** Guarda (insert o upsert por _id) el documento del conteo. */
  async guardar(entity: ConteoInventarioEntity): Promise<ConteoInventarioEntity> {
    return await this.conteoInventarioRepository.save(entity);
  }
}
