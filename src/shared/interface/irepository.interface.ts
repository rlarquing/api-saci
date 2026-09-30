import { Pagination, PaginationOptions } from '../pagination';
import { DeleteResult } from 'typeorm';

export interface IRepository<ENTITY> {
  findAll(
    options: PaginationOptions,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ENTITY> | ENTITY[]>;

  findById(id: string): Promise<ENTITY>;

  findByIds(ids: string[]): Promise<ENTITY[]>;

  createSelect(): Promise<any[]>;

  create(object: ENTITY): Promise<ENTITY>;

  update(object: ENTITY): Promise<ENTITY>;

  delete(id: string): Promise<ENTITY>;

  remove(ids: string[]): Promise<DeleteResult>;

  count(): Promise<number>;

  filter(
    options: PaginationOptions,
    claves: string[],
    valores: any[],
  ): Promise<Pagination<ENTITY>>;

  search(options: PaginationOptions, search: any): Promise<Pagination<ENTITY>>;

  createSelectFilter(claves: string[], valores: any[]): Promise<ENTITY[]>;

  findBy(
    claves: string[],
    valores: any[],
    order?: any,
    take?: number,
    soloActivos?: boolean,
  ): Promise<ENTITY[]>;

  findOneBy(
    claves: string[],
    valores: any[],
    order?: any,
    soloActivos?: boolean,
  ): Promise<ENTITY>;
}
