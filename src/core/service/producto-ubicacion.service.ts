import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pagination, PaginationOptions } from '../../shared/pagination';
import { ProductoUbicacionMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import {
  ProductoUbicacionEntity,
  UserEntity,
} from '../../persistence/entity';
import {
  GenericNomencladorRepository,
  ProductoUbicacionRepository,
} from '../../persistence/repository';
import { NomencladorTypeEnum } from '../../shared/enum';
import {
  BinResueltoDto,
  CreateProductoUbicacionDto,
  ReadProductoUbicacionDto,
  ResponseDto,
  SelectDto,
  UpdateProductoUbicacionDto,
} from '../../shared/dto';

/**
 * Bins por producto/almacén (backlog P3 — patrón Sortly/Odoo).
 * Regla: una sola ubicación ACTIVA por par producto+almacén.
 */
@Injectable()
export class ProductoUbicacionService extends GenericService<ProductoUbicacionEntity> {
  constructor(
    protected configService: ConfigService,
    protected productoUbicacionRepository: ProductoUbicacionRepository,
    protected productoUbicacionMapper: ProductoUbicacionMapper,
    protected logHistoryService: LogHistoryService,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {
    super(
      configService,
      productoUbicacionRepository,
      productoUbicacionMapper,
      logHistoryService,
      true,
    );
  }

  /** Listado paginado con filtros por almacén y/o producto. */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    productoId?: string,
    sinPaginacion?: boolean,
  ):
    | Promise<Pagination<ReadProductoUbicacionDto> | ReadProductoUbicacionDto[]>
  {
    const resultado = await this.productoUbicacionRepository.listar(
      options,
      almacenId,
      productoId,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) {
      return await Promise.all(
        resultado.map((e) => this.productoUbicacionMapper.entityToDto(e)),
      );
    }

    const items = await Promise.all(
      resultado.items.map((e) => this.productoUbicacionMapper.entityToDto(e)),
    );
    return new Pagination<ReadProductoUbicacionDto>(
      items,
      resultado.meta,
      resultado.links,
    );
  }

  /** Bins activos de un producto (ficha web). */
  async listarPorProducto(
    productoId: string,
  ): Promise<ReadProductoUbicacionDto[]> {
    const rows = await this.productoUbicacionRepository.findByProducto(
      productoId,
    );
    return await Promise.all(
      rows.map((e) => this.productoUbicacionMapper.entityToDto(e)),
    );
  }

  /** Crea el vínculo; rechaza duplicados activos producto+almacén. */
  async crear(
    user: UserEntity,
    dto: CreateProductoUbicacionDto,
    ip: string,
  ): Promise<ResponseDto> {
    const existente =
      await this.productoUbicacionRepository.findPorProductoYAlmacen(
        dto.productoId,
        dto.almacenId,
      );
    if (existente) {
      throw new ConflictException(
        `${existente.productoCodigo} ya tiene el bin ${existente.ubicacionNombre} en ${existente.almacenNombre}: edítalo en lugar de duplicarlo`,
      );
    }
    return await this.create(user, dto, ip);
  }

  /** Actualiza la ubicación de un vínculo existente. */
  async actualizar(
    user: UserEntity,
    id: string,
    dto: UpdateProductoUbicacionDto,
    ip: string,
  ): Promise<ResponseDto> {
    return await this.update(user, id, dto, ip);
  }

  /** Soft-delete del vínculo. */
  async eliminar(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    return await this.deleteMultiple(user, [id], ip);
  }

  /**
   * Bin de un producto en un almacén para la ficha del escáner (P3).
   * Devuelve null si no hay vínculo (la ficha muestra «sin bin»).
   */
  async resolverBin(
    productoId: string,
    almacenId: string,
  ): Promise<BinResueltoDto> {
    const bin = await this.productoUbicacionRepository.findPorProductoYAlmacen(
      productoId,
      almacenId,
    );
    return {
      productoId,
      almacenId,
      ubicacionNombre: bin?.ubicacionNombre ?? null,
      id: bin?.getIdString() ?? null,
    };
  }

  /** Select de ubicaciones activas de un almacén (combo web). */
  async selectUbicaciones(almacenId?: string): Promise<SelectDto[]> {
    const ubicaciones = await this.genericNomencladorRepository.findAllEntities(
      NomencladorTypeEnum.UBICACION,
    );
    return (ubicaciones as any[])
      .filter((u) => u.activo !== false)
      .filter((u) => {
        if (!almacenId) return true;
        const dueño = u.almacenId ? String(u.almacenId) : null;
        return !dueño || dueño === almacenId;
      })
      .map((u) => ({
        value: u.id,
        label: u.nombre,
      })) as unknown as SelectDto[];
  }
}
