import { Injectable } from '@nestjs/common';
import { GenericNomencladorEntity } from '../../persistence/entity';
import {
  CreateNomencladorDto,
  ReadNomencladorDto,
  UpdateNomencladorDto,
} from '../../shared/dto';

@Injectable()
export class GenericNomencladorMapper {
  dtoToEntity(
    createNomencladorDto: CreateNomencladorDto,
  ): GenericNomencladorEntity {
    return new GenericNomencladorEntity(createNomencladorDto);
  }

  dtoToUpdateEntity(
    updateNomencladorDto: UpdateNomencladorDto,
    updateEntity: GenericNomencladorEntity,
  ): GenericNomencladorEntity {
    updateEntity.nombre = updateNomencladorDto.nombre;
    updateEntity.descripcion = updateNomencladorDto.descripcion;
    return updateEntity;
  }

  entityToDto(nomencladorEntity: GenericNomencladorEntity): ReadNomencladorDto {
    return new ReadNomencladorDto(
      nomencladorEntity.getIdString(),
      nomencladorEntity.nombre,
      nomencladorEntity.descripcion,
      nomencladorEntity.toString(),
    );
  }
}
