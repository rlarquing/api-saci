import { Injectable } from '@nestjs/common';
import {
  CreateRolDto,
  ReadFuncionDto,
  ReadRolDto,
  SelectDto,
  UpdateRolDto,
} from '../../shared/dto';
import { RolEntity } from '../../persistence/entity';
import { FuncionMapper } from './funcion.mapper';
import { RolRepository } from '../../persistence/repository';

@Injectable()
export class RolMapper {
  constructor(
    protected rolRepository: RolRepository,
    protected funcionMapper: FuncionMapper,
  ) {}
  async dtoToEntity(createRolDto: CreateRolDto): Promise<RolEntity> {
    const { nombre, descripcion } = createRolDto;
    const rol = new RolEntity({ nombre, descripcion });
    // Mapear funciones → funcionIds y users → userIds
    rol.funcionIds = createRolDto.funciones || [];
    rol.userIds = createRolDto.users || [];
    return rol;
  }

  async dtoToUpdateEntity(
    updateRolDto: UpdateRolDto,
    updateRolEntity: RolEntity,
  ): Promise<RolEntity> {
    updateRolEntity.nombre = updateRolDto.nombre;
    updateRolEntity.descripcion = updateRolDto.descripcion;
    if (updateRolDto.funciones) {
      updateRolEntity.funcionIds = updateRolDto.funciones;
    }
    if (updateRolDto.users) {
      updateRolEntity.userIds = updateRolDto.users;
    }
    return updateRolEntity;
  }

  async entityToDto(rolEntity: RolEntity): Promise<ReadRolDto> {
    const dtoToString: string = rolEntity.toString();
    const rol: RolEntity = await this.rolRepository.findById(
      rolEntity.getIdString(),
    );
    // Obtener funciones completas y mapearlas a ReadFuncionDto
    const funciones: ReadFuncionDto[] = [];
    if (rol.funciones && rol.funciones.length > 0) {
      for (const funcionEntity of rol.funciones) {
        funciones.push(await this.funcionMapper.entityToDto(funcionEntity));
      }
    }

    // Obtener usuarios completos y mapearlos a SelectDto
    const usuarios: SelectDto[] = [];
    if (rol.users && rol.users.length > 0) {
      for (const userEntity of rol.users) {
        const userId = userEntity.getIdString();
        const userLabel = userEntity.userName;
        usuarios.push(new SelectDto(userId, userLabel));
      }
    }

    return new ReadRolDto(
      dtoToString,
      rolEntity.getIdString(),
      rolEntity.nombre,
      rolEntity.descripcion,
      usuarios,
      funciones,
    );
  }
}
