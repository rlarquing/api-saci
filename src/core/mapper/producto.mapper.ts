import { Injectable } from '@nestjs/common';
import {
  CreateProductoDto,
  ReadProductoDto,
  SelectDto,
  UpdateProductoDto,
} from '../../shared/dto';
import { ProductoEntity } from '../../persistence/entity';
import { ProductoRepository, GenericNomencladorRepository } from '../../persistence/repository';
import { NomencladorTypeEnum } from '../../shared/enum';

@Injectable()
export class ProductoMapper {
  constructor(
    private productoRepository: ProductoRepository,
    private genericNomencladorRepository: GenericNomencladorRepository,
  ) {}

  /** Genera el SKU (PRD-XXXXXX) y resuelve los denormalizados de catálogo. */
  async dtoToEntity(createDto: CreateProductoDto): Promise<ProductoEntity> {
    const { nombre, descripcion, categoriaId, unidadId, stockMinimo } = createDto;
    const consecutivo = (await this.productoRepository.obtenerUltimoConsecutivo()) + 1;
    const codigo = `PRD-${String(consecutivo).padStart(6, '0')}`;
    const categoria = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.CATEGORIA,
      categoriaId,
    );
    const unidad = await this.genericNomencladorRepository.findById(
      NomencladorTypeEnum.UNIDAD,
      unidadId,
    );
    return new ProductoEntity({
      numeroConsecutivo: consecutivo,
      codigo,
      nombre,
      descripcion,
      categoriaId,
      categoriaNombre: categoria.nombre,
      unidadId,
      unidadNombre: unidad.nombre,
      stockMinimo: stockMinimo ?? 0,
      foto: createDto.foto ?? null,
    });
  }

  async dtoToUpdateEntity(
    updateDto: UpdateProductoDto,
    entity: ProductoEntity,
  ): Promise<ProductoEntity> {
    if (updateDto.nombre !== undefined) entity.nombre = updateDto.nombre;
    if (updateDto.descripcion !== undefined) entity.descripcion = updateDto.descripcion;
    if (updateDto.stockMinimo !== undefined) entity.stockMinimo = updateDto.stockMinimo;
    if (updateDto.categoriaId) {
      const categoria = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.CATEGORIA,
        updateDto.categoriaId,
      );
      entity.categoriaId = updateDto.categoriaId;
      entity.categoriaNombre = categoria.nombre;
    }
    if (updateDto.unidadId) {
      const unidad = await this.genericNomencladorRepository.findById(
        NomencladorTypeEnum.UNIDAD,
        updateDto.unidadId,
      );
      entity.unidadId = updateDto.unidadId;
      entity.unidadNombre = unidad.nombre;
    }
    if (updateDto.foto !== undefined) {
      entity.foto = updateDto.foto ?? null;
    }
    return entity;
  }

  async entityToDto(entity: ProductoEntity): Promise<ReadProductoDto> {
    return {
      id: entity.getIdString(),
      codigo: entity.codigo,
      nombre: entity.nombre,
      descripcion: entity.descripcion,
      categoriaId: entity.categoriaId,
      categoriaNombre: entity.categoriaNombre,
      unidadId: entity.unidadId,
      unidadNombre: entity.unidadNombre,
      stockMinimo: entity.stockMinimo,
      hasFoto: !!entity.foto,
      activo: entity.activo,
      createdAt: entity.createdAt,
    } as unknown as ReadProductoDto;
  }

  async mapToSelect(entity: ProductoEntity): Promise<SelectDto> {
    return {
      value: entity.getIdString(),
      label: `${entity.codigo} · ${entity.nombre}`,
    } as unknown as SelectDto;
  }
}
