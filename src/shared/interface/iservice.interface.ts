import { BuscarDto, FiltroGenericoDto, ResponseDto, SelectDto } from '../dto';
import { Pagination, PaginationOptions } from '../pagination';
import { DeleteResult } from 'typeorm';

export interface IService {
  findAll(
    options: PaginationOptions,
    sinPaginacion?: boolean,
  ): Promise<Pagination<any> | any[]>;

  findById(id: string): Promise<any>;

  createSelect(): Promise<SelectDto[]>;

  createSelectFilter(
    filtroGenericoDto: FiltroGenericoDto,
  ): Promise<SelectDto[]>;

  create(user: any, object: any, ip: string): Promise<ResponseDto>;

  createMultiple(user: any, object: any[], ip: string): Promise<ResponseDto[]>;

  update(user: any, id: string, object: any, ip: string): Promise<ResponseDto>;

  deleteMultiple(user: any, ids: string[], ip: string): Promise<ResponseDto>;

  removeMultiple(user: any, ids: string[], ip: string): Promise<DeleteResult>;

  count(): Promise<number>;

  filter(
    options: PaginationOptions,
    filtroGenericoDto: FiltroGenericoDto,
  ): Promise<Pagination<any>>;

  search(
    options: PaginationOptions,
    buscarDto: BuscarDto,
  ): Promise<Pagination<any>>;
}
