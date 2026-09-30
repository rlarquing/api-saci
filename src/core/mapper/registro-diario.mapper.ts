import { Injectable } from '@nestjs/common';
import { ReadRegistroDiarioDto, ReadNomencladorDto } from '../../shared/dto';
import { RegistroDiarioEntity } from '../../persistence/entity';
import { RegistroDiarioRepository } from '../../persistence/repository';
import { GenericNomencladorMapper } from './generic-nomenclador.mapper';

@Injectable()
export class RegistroDiarioMapper {
  constructor(
    protected registroDiarioRepository: RegistroDiarioRepository,
    protected genericNomencladorMapper: GenericNomencladorMapper,
  ) {}

  /**
   * Convierte una entidad a un DTO de lectura
   */
  async entityToDto(
    registroDiarioEntity: RegistroDiarioEntity,
  ): Promise<ReadRegistroDiarioDto> {
    const dtoToString: string = registroDiarioEntity.toString();
    const registroDiario: RegistroDiarioEntity =
      await this.registroDiarioRepository.findById(
        registroDiarioEntity.getIdString(),
      );

    let almacen: ReadNomencladorDto;
    if (registroDiario.almacen) {
      almacen = this.genericNomencladorMapper.entityToDto(
        registroDiario.almacen,
      );
    }

    return new ReadRegistroDiarioDto(
      dtoToString,
      registroDiarioEntity.getIdString(),
      registroDiarioEntity.fecha,
      almacen,
      registroDiarioEntity.estado,
      registroDiarioEntity.totalEntradas,
      registroDiarioEntity.totalSalidas,
      registroDiarioEntity.detalleCategorias,
    );
  }
}
