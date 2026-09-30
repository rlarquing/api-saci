import { Injectable } from '@nestjs/common';
import {
  CreateFuncionDto,
  ReadEndPointDto,
  ReadFuncionDto,
  ReadMenuDto,
  UpdateFuncionDto,
} from '../../shared/dto';
import { FuncionEntity } from '../../persistence/entity';
import { FuncionRepository } from '../../persistence/repository';
import { EndPointMapper } from './end-point.mapper';
import { MenuMapper } from './menu.mapper';

@Injectable()
export class FuncionMapper {
  constructor(
    protected funcionRepository: FuncionRepository,
    protected endPointMapper: EndPointMapper,
    protected menuMapper: MenuMapper,
  ) {}
  /**
   * Convierte un DTO de creación a una entidad
   * Ahora usa referencias de IDs en lugar de relaciones de TypeORM
   */
  async dtoToEntity(
    createFuncionDto: CreateFuncionDto,
  ): Promise<FuncionEntity> {
    const { nombre, descripcion } = createFuncionDto;
    const funcion = new FuncionEntity({
      nombre,
      descripcion,
    });

    // Asignar directamente los IDs como referencias (strings)
    if (createFuncionDto.endPoints && createFuncionDto.endPoints.length > 0) {
      funcion.endPointIds = createFuncionDto.endPoints;
    }

    // El menu ahora viene como string en el DTO
    if (createFuncionDto.menu) {
      funcion.menuId = createFuncionDto.menu;
    }

    return funcion;
  }

  /**
   * Convierte un DTO de actualización a una entidad existente
   */
  async dtoToUpdateEntity(
    updateFuncionDto: UpdateFuncionDto,
    updateFuncionEntity: FuncionEntity,
  ): Promise<FuncionEntity> {
    updateFuncionEntity.nombre = updateFuncionDto.nombre;
    updateFuncionEntity.descripcion = updateFuncionDto.descripcion;

    // Asignar directamente los IDs como referencias (strings)
    if (updateFuncionDto.endPoints && updateFuncionDto.endPoints.length > 0) {
      updateFuncionEntity.endPointIds = updateFuncionDto.endPoints;
    }

    // El menu ahora viene como string en el DTO
    if (updateFuncionDto.menu !== undefined) {
      updateFuncionEntity.menuId = updateFuncionDto.menu;
    }

    return updateFuncionEntity;
  }

  /**
   * Convierte una entidad a un DTO de lectura
   */
  async entityToDto(funcionEntity: FuncionEntity): Promise<ReadFuncionDto> {
    const dtoToString: string = funcionEntity.toString();
    const funcion: FuncionEntity = await this.funcionRepository.findById(
      funcionEntity.getIdString(),
    );
    // Obtener roles completas y mapearlas a ReadFuncionDto
    const endPoints: ReadEndPointDto[] = [];
    if (funcion.endPoints && funcion.endPoints.length > 0) {
      for (const endPointEntity of funcion.endPoints) {
        endPoints.push(this.endPointMapper.entityToDto(endPointEntity));
      }
    }
    // Obtener funciones completas y mapearlas a ReadFuncionDto
    let menu: ReadMenuDto;
    if (funcion.menu) {
      menu = await this.menuMapper.entityToDto(funcion.menu);
    }

    return new ReadFuncionDto(
      dtoToString,
      funcionEntity.getIdString() || '',
      funcionEntity.nombre,
      funcionEntity.descripcion,
      endPoints,
      menu,
    );
  }
}
