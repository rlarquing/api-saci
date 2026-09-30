import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ProductoMapper } from '../mapper';
import { LogHistoryService } from './log-history.service';
import { GenericService } from './generic.service';
import { ProductoEntity, UserEntity } from '../../persistence/entity';
import { ProductoRepository } from '../../persistence/repository';

/**
 * Servicio de productos. El CRUD completo (create/update/delete/audit con
 * trazas) lo aporta GenericService; aquí vive solo lo específico del dominio:
 * la unicidad de SKU y la búsqueda por código para el escáner manual.
 */
@Injectable()
export class ProductoService extends GenericService<ProductoEntity> {
  constructor(
    protected configService: ConfigService,
    protected productoRepository: ProductoRepository,
    protected productoMapper: ProductoMapper,
    protected logHistoryService: LogHistoryService,
  ) {
    super(configService, productoRepository, productoMapper, logHistoryService, true);
  }

  /** Búsqueda por SKU para el escáner manual. */
  async findByCodigo(codigo: string): Promise<ProductoEntity> {
    const producto = await this.productoRepository.findByCodigo(codigo);
    if (!producto) {
      throw new NotFoundException(`No existe un producto activo con el código ${codigo}`);
    }
    return producto;
  }
}
