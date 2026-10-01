import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pagination, PaginationOptions } from '../../shared/pagination';
import { NivelStockMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { NivelStockEntity, ProductoEntity, UserEntity } from '../../persistence/entity';
import { NivelStockRepository } from '../../persistence/repository';
import {
  CreateNivelStockDto,
  ReadNivelStockDto,
  ResponseDto,
  UpdateNivelStockDto,
} from '../../shared/dto';

/** Umbrales efectivos de un producto en un almacén. */
export interface UmbralStock {
  stockMinimo: number;
  stockSeguridad: number;
  puntoReorden: number;
}

/**
 * Niveles de stock por producto/almacén (backlog P2 — patrón BoxHero).
 * Regla: un solo nivel ACTIVO por par producto+almacén (el global del
 * producto actúa como fallback cuando no hay nivel específico).
 */
@Injectable()
export class NivelStockService extends GenericService<NivelStockEntity> {
  constructor(
    protected configService: ConfigService,
    protected nivelStockRepository: NivelStockRepository,
    protected nivelStockMapper: NivelStockMapper,
    protected logHistoryService: LogHistoryService,
  ) {
    super(
      configService,
      nivelStockRepository,
      nivelStockMapper,
      logHistoryService,
      true,
    );
  }

  /** Listado paginado con puntoReorden ya resuelto. */
  async listar(
    options: PaginationOptions,
    almacenId?: string,
    productoId?: string,
    sinPaginacion?: boolean,
  ): Promise<Pagination<ReadNivelStockDto> | ReadNivelStockDto[]> {
    const resultado = await this.nivelStockRepository.listar(
      options,
      almacenId,
      productoId,
      sinPaginacion,
    );

    if (Array.isArray(resultado)) {
      return await Promise.all(
        resultado.map((e) => this.nivelStockMapper.entityToDto(e)),
      );
    }

    const items = await Promise.all(
      resultado.items.map((e) => this.nivelStockMapper.entityToDto(e)),
    );
    return new Pagination<ReadNivelStockDto>(items, resultado.meta, resultado.links);
  }

  /** Crea un nivel; rechaza duplicados activos producto+almacén. */
  async crear(user: UserEntity, dto: CreateNivelStockDto, ip: string): Promise<ResponseDto> {
    const existente = await this.nivelStockRepository.findPorProductoYAlmacen(
      dto.productoId,
      dto.almacenId,
    );
    if (existente) {
      throw new ConflictException(
        `Ya existe un nivel para ${existente.productoCodigo} en ${existente.almacenNombre}: edítalo en lugar de duplicarlo`,
      );
    }
    return await this.create(user, dto, ip);
  }

  /** Actualiza umbrales de un nivel existente. */
  async actualizar(
    user: UserEntity,
    id: string,
    dto: UpdateNivelStockDto,
    ip: string,
  ): Promise<ResponseDto> {
    return await this.update(user, id, dto, ip);
  }

  /** Soft-delete del nivel (queda inactivo; se puede recrear). */
  async eliminar(user: UserEntity, id: string, ip: string): Promise<ResponseDto> {
    return await this.deleteMultiple(user, [id], ip);
  }

  /**
   * Umbral efectivo de un producto en un almacén: el nivel específico
   * (producto+almacén) si existe; si no, los globales del producto.
   */
  async resolverUmbral(
    producto: ProductoEntity,
    almacenId: string,
  ): Promise<UmbralStock> {
    const nivel = await this.nivelStockRepository.findPorProductoYAlmacen(
      producto.getIdString(),
      almacenId,
    );
    const stockMinimo = nivel ? nivel.stockMinimo : (producto.stockMinimo ?? 0);
    const stockSeguridad = nivel
      ? nivel.stockSeguridad
      : (producto.stockSeguridad ?? 0);
    return {
      stockMinimo,
      stockSeguridad,
      puntoReorden: stockMinimo + stockSeguridad,
    };
  }
}
