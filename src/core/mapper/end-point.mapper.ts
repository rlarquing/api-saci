import { Injectable } from '@nestjs/common';
import { EndPointEntity } from '../../persistence/entity';
import { CreateEndPointDto, ReadEndPointDto } from '../../shared/dto';

@Injectable()
export class EndPointMapper {
  /**
   * Convierte un DTO de creación a una entidad
   */
  dtoToEntity(createEndPointDto: CreateEndPointDto): EndPointEntity {
    return new EndPointEntity({
      controller: createEndPointDto.controller,
      servicio: createEndPointDto.servicio,
      ruta: createEndPointDto.ruta,
      nombre: createEndPointDto.nombre,
      metodo: createEndPointDto.metodo,
    });
  }

  /**
   * Convierte una entidad a un DTO de lectura
   */
  entityToDto(endPointEntity: EndPointEntity): ReadEndPointDto {
    const dtoToString: string = endPointEntity.toString();
    return new ReadEndPointDto(
      dtoToString,
      endPointEntity.id.toHexString(),
      endPointEntity.controller,
      endPointEntity.servicio,
      endPointEntity.ruta,
      endPointEntity.nombre,
      endPointEntity.metodo,
    );
  }
}
