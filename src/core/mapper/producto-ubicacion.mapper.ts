import { Injectable, NotFoundException } from '@nestjs/common';
import {
  BinResueltoDto,
  CreateProductoUbicacionDto,
  ReadProductoUbicacionDto,
  SelectDto,
  UpdateProductoUbicacionDto,
} from '../../shared/dto';
import { ProductoUbicacionEntity } from '../../persistence/entity';
import {
  GenericNomencladorRepository,
  ProductoRepository,
  ProductoUbicacionRepository,
} from '../../persistence/repository';
import { NomencladorTypeEnum } from '../../shared/enum';

@Injectable()
export class ProductoUbicacionMapper {
  constructor(
    private productoRepository: ProductoRepository,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {}

  /** Resuelve los denormalizados (producto + almacén + bin) al crear el vínculo. */
  async dtoToEntity(
    createDto: CreateProductoUbicacionDto,
  ): Promise<ProductoUbicacionEntity> {
    const producto = await this.productoRepository.findById(createDto.productoId);
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
    const ubicacion = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.UBICACION,
      createDto.ubicacionId,
    );
    if (!ubicacion || !ubicacion.activo) {
      throw new NotFoundException('La ubicación no existe o está inactiva');
    }
    // Si el nomenclador declara almacén dueño, debe coincidir
    const dueño = (ubicacion as any).almacenId
      ? String((ubicacion as any).almacenId)
      : null;
    if (dueño && dueño !== createDto.almacenId) {
      throw new NotFoundException(
        `La ubicación ${ubicacion.nombre} no pertenece al almacén ${almacen.nombre}`,
      );
    }
    return new ProductoUbicacionEntity({
      productoId: producto.getIdString(),
      productoCodigo: producto.codigo,
      productoNombre: producto.nombre,
      almacenId: createDto.almacenId,
      almacenNombre: almacen.nombre,
      ubicacionId: createDto.ubicacionId,
      ubicacionNombre: ubicacion.nombre,
    });
  }

  async dtoToUpdateEntity(
    updateDto: UpdateProductoUbicacionDto,
    entity: ProductoUbicacionEntity,
  ): Promise<ProductoUbicacionEntity> {
    if (updateDto.ubicacionId) {
      const ubicacion = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.UBICACION,
        updateDto.ubicacionId,
      );
      if (!ubicacion || !ubicacion.activo) {
        throw new NotFoundException('La ubicación no existe o está inactiva');
      }
      const dueño = (ubicacion as any).almacenId
        ? String((ubicacion as any).almacenId)
        : null;
      if (dueño && dueño !== entity.almacenId) {
        throw new NotFoundException(
          `La ubicación ${ubicacion.nombre} no pertenece al almacén ${entity.almacenNombre}`,
        );
      }
      entity.ubicacionId = updateDto.ubicacionId;
      entity.ubicacionNombre = ubicacion.nombre;
    }
    // Producto y almacén no se cambian: se borra y se crea otro vínculo.
    return entity;
  }

  async entityToDto(entity: ProductoUbicacionEntity): Promise<ReadProductoUbicacionDto> {
    return {
      id: entity.getIdString(),
      productoId: entity.productoId,
      productoCodigo: entity.productoCodigo,
      productoNombre: entity.productoNombre,
      almacenId: entity.almacenId,
      almacenNombre: entity.almacenNombre,
      ubicacionId: entity.ubicacionId,
      ubicacionNombre: entity.ubicacionNombre,
      activo: entity.activo,
    } as unknown as ReadProductoUbicacionDto;
  }

  async mapToSelect(entity: ProductoUbicacionEntity): Promise<SelectDto> {
    return {
      value: entity.getIdString(),
      label: `${entity.productoCodigo} · ${entity.ubicacionNombre} @ ${entity.almacenNombre}`,
    } as unknown as SelectDto;
  }
}
