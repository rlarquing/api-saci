import { Injectable } from '@nestjs/common';
import { ReadMovimientoInventarioDto } from '../../shared/dto';
import { MovimientoInventarioEntity } from '../../persistence/entity';

/**
 * Mapper del kardex: los movimientos se construyen en el service (validados),
 * así que dtoToEntity no aplica; solo se mapea entity → ReadDto.
 */
@Injectable()
export class MovimientoInventarioMapper {
  async entityToDto(
    entity: MovimientoInventarioEntity,
  ): Promise<ReadMovimientoInventarioDto> {
    return {
      id: entity.getIdString(),
      tipo: entity.tipo,
      productoCodigo: entity.productoCodigo,
      productoNombre: entity.productoNombre,
      cantidad: entity.cantidad,
      almacenNombre: entity.almacenNombre,
      almacenDestinoNombre: entity.almacenDestinoNombre,
      qrCodigo: entity.qrCodigo,
      userName: entity.userName,
      fecha: entity.fecha,
      saldoResultante: entity.saldoResultante,
      observaciones: entity.observaciones,
      signoAjuste: entity.signoAjuste,
    } as unknown as ReadMovimientoInventarioDto;
  }

  // Contrato del GenericService (no usado por este dominio)
  async dtoToEntity(_: any): Promise<MovimientoInventarioEntity> {
    throw new Error('Los movimientos se crean vía entrada/salida/ajuste/traslado');
  }

  async dtoToUpdateEntity(_: any, entity: MovimientoInventarioEntity) {
    return entity;
  }

  async mapToSelect(entity: MovimientoInventarioEntity) {
    return { value: entity.getIdString(), label: entity.toString() };
  }
}
