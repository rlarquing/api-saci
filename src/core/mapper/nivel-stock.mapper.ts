import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateNivelStockDto,
  ReadNivelStockDto,
  SelectDto,
  UpdateNivelStockDto,
} from '../../shared/dto';
import { NivelStockEntity, ProductoEntity } from '../../persistence/entity';
import {
  ProductoRepository,
  GenericNomencladorRepository,
} from '../../persistence/repository';
import { NomencladorTypeEnum } from '../../shared/enum';

@Injectable()
export class NivelStockMapper {
  constructor(
    private productoRepository: ProductoRepository,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {}

  /** Resuelve los denormalizados (producto + almacén) al crear el nivel. */
  async dtoToEntity(createDto: CreateNivelStockDto): Promise<NivelStockEntity> {
    const producto: ProductoEntity | null =
      await this.productoRepository.findById(createDto.productoId);
    if (!producto || !producto.activo) {
      throw new NotFoundException('El producto no existe o está inactivo');
    }
    const almacen = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.ALMACEN,
      createDto.almacenId,
    );
    if (!almacen) {
      throw new NotFoundException('El almacén no existe');
    }
    return new NivelStockEntity({
      productoId: producto.getIdString(),
      productoCodigo: producto.codigo,
      productoNombre: producto.nombre,
      almacenId: createDto.almacenId,
      almacenNombre: almacen.nombre,
      stockMinimo: createDto.stockMinimo ?? 0,
      stockSeguridad: createDto.stockSeguridad ?? 0,
    });
  }

  async dtoToUpdateEntity(
    updateDto: UpdateNivelStockDto,
    entity: NivelStockEntity,
  ): Promise<NivelStockEntity> {
    if (updateDto.stockMinimo !== undefined) {
      entity.stockMinimo = updateDto.stockMinimo;
    }
    if (updateDto.stockSeguridad !== undefined) {
      entity.stockSeguridad = updateDto.stockSeguridad;
    }
    // El producto y el almacén no se cambian: se borra y se crea otro nivel.
    return entity;
  }

  async entityToDto(entity: NivelStockEntity): Promise<ReadNivelStockDto> {
    return {
      id: entity.getIdString(),
      productoId: entity.productoId,
      productoCodigo: entity.productoCodigo,
      productoNombre: entity.productoNombre,
      almacenId: entity.almacenId,
      almacenNombre: entity.almacenNombre,
      stockMinimo: entity.stockMinimo,
      stockSeguridad: entity.stockSeguridad,
      puntoReorden: entity.stockMinimo + entity.stockSeguridad,
      activo: entity.activo,
      createdAt: entity.createdAt,
    } as unknown as ReadNivelStockDto;
  }

  async mapToSelect(entity: NivelStockEntity): Promise<SelectDto> {
    return {
      value: entity.getIdString(),
      label: `${entity.productoCodigo} · ${entity.productoNombre} @ ${entity.almacenNombre}`,
    } as unknown as SelectDto;
  }
}
