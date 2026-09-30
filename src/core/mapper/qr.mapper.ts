import { Injectable } from '@nestjs/common';
import { QrEntity } from '../../persistence/entity';
import { ReadQrDto } from '../../shared/dto';

@Injectable()
export class QrMapper {
  /**
   * Convierte una entidad a DTO de lectura
   * @param entity Entidad a convertir
   * @returns DTO de lectura
   */
  async entityToDto(entity: QrEntity): Promise<ReadQrDto> {
    const dto = new ReadQrDto();
    dto.id = entity.id?.toHexString?.() || entity.id?.toString?.() || '';
    dto.codigo = entity.codigo;
    dto.numeroConsecutivo = entity.numeroConsecutivo;
    dto.productoId = entity.productoId;
    dto.productoNombre = entity.productoNombre;
    dto.productoCodigo = entity.productoCodigo;
    dto.contenido = entity.contenido;
    dto.fechaGeneracion = entity.fechaGeneracion;
    dto.loteId = entity.loteId;
    dto.almacenId = entity.almacenId;
    dto.estado = entity.estado;
    dto.fechaEstado = entity.fechaEstado;
    dto.activo = entity.activo;
    dto.almacenId = entity.almacenId;
    dto.almacenNombre = entity.almacenNombre;
    return dto;
  }

  /**
   * Convierte una lista de entidades a DTOs
   * @param entities Lista de entidades
   * @returns Lista de DTOs
   */
  async entitiesToDtos(entities: QrEntity[]): Promise<ReadQrDto[]> {
    const dtos: ReadQrDto[] = [];
    for (const entity of entities) {
      dtos.push(await this.entityToDto(entity));
    }
    return dtos;
  }
}
