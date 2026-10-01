import { Injectable } from '@nestjs/common';
import {
  CreateConteoDto,
  ReadConteoDto,
} from '../../shared/dto';
import { ConteoInventarioEntity } from '../../persistence/entity';

@Injectable()
export class ConteoInventarioMapper {
  /** La creación real del documento vive en el service (snapshot de stock); */
  /** este mapper solo cubre el contrato con GenericService. */
  async dtoToEntity(
    createDto: CreateConteoDto,
  ): Promise<ConteoInventarioEntity> {
    return new ConteoInventarioEntity({
      almacenId: createDto.almacenId,
      esCiego: createDto.esCiego ?? false,
      estado: 'ABIERTO' as any,
      lineas: [],
    });
  }

  async dtoToUpdateEntity(
    _updateDto: any,
    entity: ConteoInventarioEntity,
  ): Promise<ConteoInventarioEntity> {
    return entity;
  }

  async entityToDto(entity: ConteoInventarioEntity): Promise<ReadConteoDto> {
    const lineas = (entity.lineas ?? []).map((l) => ({
      productoId: l.productoId,
      productoCodigo: l.productoCodigo,
      productoNombre: l.productoNombre,
      cantidadEsperada: l.cantidadEsperada,
      cantidadContada: l.cantidadContada ?? null,
      stockAlCierre: l.stockAlCierre ?? null,
      diferencia: l.diferencia ?? null,
      ajusteId: l.ajusteId ?? null,
      observaciones: l.observaciones ?? null,
    }));
    return {
      id: entity.getIdString(),
      almacenId: entity.almacenId,
      almacenNombre: entity.almacenNombre,
      userName: entity.userName,
      estado: entity.estado,
      esCiego: entity.esCiego,
      fechaApertura: entity.fechaApertura,
      fechaCierre: entity.fechaCierre,
      lineas,
      resumen: entity.resumen ?? null,
      totalLineas: lineas.length,
      totalContadas: lineas.filter((l) => l.cantidadContada !== null).length,
      activo: entity.activo,
      createdAt: entity.createdAt,
    } as unknown as ReadConteoDto;
  }

  async mapToSelect(entity: ConteoInventarioEntity): Promise<any> {
    return {
      value: entity.getIdString(),
      label: `${entity.almacenNombre} · ${new Date(entity.createdAt ?? Date.now()).toISOString().slice(0, 10)} · ${entity.estado}`,
    };
  }
}
