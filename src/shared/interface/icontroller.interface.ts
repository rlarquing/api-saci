import { BuscarDto, FiltroGenericoDto, ResponseDto, SelectDto } from '../dto';
import { Pagination } from '../pagination';

export interface IController {
  findAll(
    page?: number,
    limit?: number,
    sinPaginacion?: boolean,
    user?: any,
  ): Promise<Pagination<any> | any[]>;

  findById(id: string): Promise<any>;

  findByIds(ids: string[]): Promise<any[]>;

  createSelect(): Promise<SelectDto[]>;

  createSelectFilter(
    filtroGenericoDto: FiltroGenericoDto,
  ): Promise<SelectDto[]>;

  create(user: any, object: any, ip: string): Promise<ResponseDto>;

  createMultiple(user: any, object: any[], ip: string): Promise<ResponseDto[]>;

  update(user: any, id: string, object: any, ip: string): Promise<ResponseDto>;

  updateMultiple(user: any, object: any[], ip: string): Promise<ResponseDto>;

  filter(
    page?: number,
    limit?: number,
    filtroGenericoDto?: FiltroGenericoDto,
  ): Promise<Pagination<any>>;
  search(
    page?: number,
    limit?: number,
    buscarDto?: BuscarDto,
  ): Promise<Pagination<any>>;
}
